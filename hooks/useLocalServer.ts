import { useState, useEffect, useRef } from 'react';
import TcpSocket from 'react-native-tcp-socket';

interface ClientConnection {
  id: string;
  socket: any;
  username?: string;
}

interface GameRoom {
  code: string;
  hostUsername: string;
  mode: string;
  time: string;
  variant: string;
  chess960Fen?: string;
  guest?: ClientConnection;
  flipped: boolean;
}

let serverInstance: any = null;
let currentRoom: GameRoom | null = null;
const clients: Map<string, ClientConnection> = new Map();
const moveListeners: Set<(msg: any) => void> = new Set();

// Global cleanup function that can be called from anywhere
const globalForceCleanup = () => {
  console.log('[LocalServer] Global force cleanup initiated');
  
  // Close all client connections
  clients.forEach((client) => {
    try {
      client.socket.destroy();
      client.socket.end();
    } catch (e) {
      // Ignore errors during cleanup
    }
  });
  clients.clear();

  // Close the server if it exists
  if (serverInstance) {
    try {
      // Call both close and destroy to ensure native socket is released
      serverInstance.destroy?.();
      serverInstance.close?.();
      serverInstance._unref?.();
    } catch (e) {
      console.error('[GlobalCleanup] Error closing server:', e);
    }
  }

  serverInstance = null;
  currentRoom = null;
  moveListeners.clear();
  
  console.log('[LocalServer] Global force cleanup completed');
};

export function useLocalServer() {
  const [isRunning, setIsRunning] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [guestUsername, setGuestUsername] = useState<string | null>(null);
  const [needsRestart, setNeedsRestart] = useState(false);
  const serverRef = useRef<any>(null);

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const generateChess960Fen = () => {
    let position: (string | null)[] = new Array(8).fill(null);
    
    // Place bishops on opposite colors
    const lightSquares = [1, 3, 5, 7];
    const darkSquares = [0, 2, 4, 6];
    
    const lightBishopPos = lightSquares[Math.floor(Math.random() * lightSquares.length)];
    const darkBishopPos = darkSquares[Math.floor(Math.random() * darkSquares.length)];
    
    position[lightBishopPos] = 'b';
    position[darkBishopPos] = 'b';
    
    // Get remaining empty positions
    let emptyPositions = position.map((p, i) => p === null ? i : null).filter(i => i !== null) as number[];
    
    // Place queen
    const queenIndex = Math.floor(Math.random() * emptyPositions.length);
    position[emptyPositions[queenIndex]] = 'q';
    emptyPositions = emptyPositions.filter((_, idx) => idx !== queenIndex);
    
    // Place knights
    const knight1Index = Math.floor(Math.random() * emptyPositions.length);
    position[emptyPositions[knight1Index]] = 'n';
    emptyPositions = emptyPositions.filter((_, idx) => idx !== knight1Index);
    
    const knight2Index = Math.floor(Math.random() * emptyPositions.length);
    position[emptyPositions[knight2Index]] = 'n';
    emptyPositions = emptyPositions.filter((_, idx) => idx !== knight2Index);
    
    // Place rooks and king (R-K-R pattern)
    emptyPositions.sort((a, b) => a - b);
    position[emptyPositions[0]] = 'r';
    position[emptyPositions[1]] = 'k';
    position[emptyPositions[2]] = 'r';
    
    const backRank = position.map(p => p || '?').join('');
    return `${backRank}/pppppppp/8/8/8/8/PPPPPPPP/${backRank.toUpperCase()} w KQkq - 0 1`;
  };

  const broadcastToClients = (message: any) => {
    const msgStr = JSON.stringify(message);
    clients.forEach((client) => {
      try {
        client.socket.write(msgStr + '\n');
      } catch (error) {
        console.error('Failed to send to client:', error);
      }
    });
  };

  const handleClientMessage = (clientId: string, data: string) => {
    try {
      const messages = data.split('\n').filter(Boolean);
      
      messages.forEach((msgStr) => {
        const msg = JSON.parse(msgStr);
        console.log('[LocalServer] Received:', msg);

        switch (msg.type) {
          case 'join':
            if (!currentRoom || currentRoom.code !== msg.code) {
              const client = clients.get(clientId);
              if (client) {
                client.socket.write(JSON.stringify({ type: 'error', message: 'Room not found' }) + '\n');
              }
              return;
            }

            const joiningClient = clients.get(clientId);
            if (joiningClient) {
              joiningClient.username = msg.username;
              currentRoom.guest = joiningClient;
              setGuestUsername(msg.username);

              // Notify guest they joined successfully
              joiningClient.socket.write(JSON.stringify({
                type: 'joined',
                hostUsername: currentRoom.hostUsername,
                mode: currentRoom.mode,
                time: currentRoom.time,
                variant: currentRoom.variant,
                chess960Fen: currentRoom.chess960Fen,
              }) + '\n');

              // Notify host that opponent joined
              // (host is not a TCP client, so we update via callback)
            }
            break;

          case 'leave':
          case 'abandon':
            if (currentRoom && currentRoom.guest?.id === clientId) {
              currentRoom.guest = undefined;
              setGuestUsername(null);
              console.log('[LocalServer] Guest left/abandoned - clearing guest');
              
              // If it's abandon (during game), notify host via move listeners
              if (msg.type === 'abandon') {
                moveListeners.forEach((listener) => listener({ type: 'abandon' }));
              }
            }
            break;

          case 'move':
          case 'resign':
          case 'draw_offer':
          case 'draw_accept':
          case 'game_over':
            // Forward game messages to host (via listeners)
            moveListeners.forEach((listener) => listener(msg));
            break;

          case 'game_state':
          case 'draw_decline':
            // Broadcast game messages to all clients (guest)
            broadcastToClients(msg);
            break;
        }
      });
    } catch (error) {
      console.error('[LocalServer] Error parsing message:', error);
    }
  };

  const stopServer = () => {
    console.log('[LocalServer] Stopping server...');
    
    // Immediate synchronous cleanup first
    clients.forEach((client) => {
      try {
        client.socket.destroy();
      } catch (e) {
        // Ignore errors
      }
    });
    clients.clear();

    if (serverInstance) {
      try {
        serverInstance.close();
      } catch (e) {
        console.error('Error closing server:', e);
      }
    }

    serverInstance = null;
    serverRef.current = null;
    currentRoom = null;
    moveListeners.clear();
    
    setIsRunning(false);
    setRoomCode(null);
    setGuestUsername(null);
    
    console.log('[LocalServer] Server stopped');
  };

  const forceCleanup = () => {
    console.log('[LocalServer] Force cleanup initiated');
    
    // Use the global cleanup
    globalForceCleanup();
    
    // Also clear the ref
    serverRef.current = null;
    
    setIsRunning(false);
    setRoomCode(null);
    setGuestUsername(null);
    
    console.log('[LocalServer] Force cleanup completed');
  };

  const attemptStartServer = (params: {
    username: string;
    mode: string;
    time: string;
    variant: string;
  }, retryCount = 0) => {
    const code = generateRoomCode();
    const chess960Fen = params.variant === 'chess960' ? generateChess960Fen() : undefined;

    currentRoom = {
      code,
      hostUsername: params.username,
      mode: params.mode,
      time: params.time,
      variant: params.variant,
      chess960Fen,
      flipped: false,
    };

    try {
      const server = TcpSocket.createServer((socket) => {
        const clientId = `client_${Date.now()}_${Math.random()}`;
        console.log('[LocalServer] Client connected:', clientId);

        const client: ClientConnection = {
          id: clientId,
          socket,
        };
        clients.set(clientId, client);

        socket.on('data', (data) => {
          handleClientMessage(clientId, data.toString());
        });

        socket.on('close', () => {
          console.log('[LocalServer] Client disconnected:', clientId);
          if (currentRoom && currentRoom.guest?.id === clientId) {
            currentRoom.guest = undefined;
            setGuestUsername(null);
          }
          clients.delete(clientId);
        });

        socket.on('error', (error) => {
          console.error('[LocalServer] Socket error:', error);
          clients.delete(clientId);
        });
      });

      // IMPORTANT: Store server reference BEFORE attempting to listen
      // This ensures we can clean it up even if listen() fails
      const tempServerRef = server;

      server.on('error', (error: any) => {
        console.error('[LocalServer] Server error:', error);
        
        if (error.code === 'EADDRINUSE') {
          console.log(`[LocalServer] Port 3001 is already in use (attempt ${retryCount + 1}/5)`);
          
          // Clean up the failed server attempt
          try {
            tempServerRef.close();
            tempServerRef.destroy?.();
          } catch (e) {
            console.error('Error closing failed server:', e);
          }
          
          // Retry up to 5 times with increasing delays
          if (retryCount < 5) {
            const delay = 800 * (retryCount + 1); // 800ms, 1600ms, 2400ms, 3200ms, 4000ms
            console.log(`[LocalServer] Retrying in ${delay}ms...`);
            
            setTimeout(() => {
              globalForceCleanup();
              attemptStartServer(params, retryCount + 1);
            }, delay);
          } else {
            console.error('[LocalServer] Failed to start server after 5 attempts');
            console.error('[LocalServer] The TCP port is stuck at the native level.');
            console.error('[LocalServer] Please CLOSE and REOPEN the app completely.');
            globalForceCleanup();
            setIsRunning(false);
            setRoomCode(null);
            setNeedsRestart(true); // Signal UI to show restart message
          }
        } else {
          setIsRunning(false);
        }
      });

      // Set socket options to allow address reuse
      // Try binding with various options to avoid EADDRINUSE
      const listenOptions: any = { 
        port: 3001, 
        host: '0.0.0.0',
        reuseAddress: true,
        exclusive: false
      };
      
      server.listen(listenOptions, () => {
        console.log('[LocalServer] Server started on port 3001');
        console.log('[LocalServer] Room code:', code);
        setIsRunning(true);
        setRoomCode(code);
      });

      serverInstance = server;
      serverRef.current = server;
    } catch (error) {
      console.error('[LocalServer] Failed to start server:', error);
      setIsRunning(false);
    }
  };

  const startServer = (params: {
    username: string;
    mode: string;
    time: string;
    variant: string;
  }) => {
    console.log('[LocalServer] Starting server - forcing cleanup first');
    
    // ALWAYS force cleanup before starting, regardless of state
    globalForceCleanup();
    serverRef.current = null;
    setIsRunning(false);
    setRoomCode(null);
    setGuestUsername(null);
    
    // Wait for cleanup to complete, then start server
    setTimeout(() => {
      attemptStartServer(params, 0);
    }, 300);
  };

  const updateColor = (flipped: boolean) => {
    if (currentRoom) {
      currentRoom.flipped = flipped;
      if (currentRoom.guest) {
        broadcastToClients({ type: 'color_update', flipped });
      }
    }
  };

  const startGame = (flipped: boolean) => {
    if (currentRoom) {
      currentRoom.flipped = flipped;
      const gameStartMsg = {
        type: 'game_start',
        flipped,
        variant: currentRoom.variant,
        chess960Fen: currentRoom.chess960Fen,
      };
      broadcastToClients(gameStartMsg);
    }
  };

  const sendMessage = (message: any) => {
    // Message already has the correct structure { type: '...', ...data }
    // Just broadcast it directly to clients
    broadcastToClients(message);
  };

  const addMoveListener = (handler: (msg: any) => void) => {
    moveListeners.add(handler);
    return () => {
      moveListeners.delete(handler);
    };
  };

  useEffect(() => {
    return () => {
      forceCleanup();
    };
  }, []);

  return {
    isRunning,
    roomCode,
    guestUsername,
    needsRestart,
    startServer,
    stopServer,
    forceCleanup,
    updateColor,
    startGame,
    sendMessage,
    addMoveListener,
  };
}
