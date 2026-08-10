import { useState, useEffect, useRef } from 'react';
import TcpSocket from 'react-native-tcp-socket';
import { getServerUrl } from '../config';

type MessageHandler = (msg: any) => void;

let clientSocket: any = null;
const messageListeners: Set<MessageHandler> = new Set();

export function useLocalClient() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<any>(null);
  const bufferRef = useRef<string>('');

  const connect = async (): Promise<boolean> => {
    if (clientSocket && clientSocket.readyState === 'open') {
      console.log('[LocalClient] Already connected');
      return true;
    }

    try {
      const serverUrl = await getServerUrl();
      console.log('[LocalClient] Connecting to:', serverUrl);

      // Parse WebSocket URL to get host and port
      // Format: ws://192.168.x.x:3001 or wss://...
      const url = new URL(serverUrl);
      const host = url.hostname;
      const port = parseInt(url.port || '3001', 10);

      return new Promise((resolve, reject) => {
        const socket = TcpSocket.createConnection(
          {
            host,
            port,
          },
          () => {
            console.log('[LocalClient] Connected to server');
            setIsConnected(true);
            setError(null);
            resolve(true);
          }
        );

        socket.on('data', (data) => {
          const chunk = data.toString();
          bufferRef.current += chunk;

          // Process complete messages (delimited by newline)
          const messages = bufferRef.current.split('\n');
          bufferRef.current = messages.pop() || ''; // Keep incomplete message

          messages.forEach((msgStr) => {
            if (!msgStr.trim()) return;

            try {
              const msg = JSON.parse(msgStr);
              console.log('[LocalClient] Received:', msg);
              messageListeners.forEach((handler) => handler(msg));
            } catch (err) {
              console.error('[LocalClient] Failed to parse message:', err);
            }
          });
        });

        socket.on('error', (err) => {
          console.error('[LocalClient] Socket error:', err);
          setError('Connection failed');
          setIsConnected(false);
          reject(err);
        });

        socket.on('close', () => {
          console.log('[LocalClient] Connection closed');
          setIsConnected(false);
          clientSocket = null;
        });

        clientSocket = socket;
        socketRef.current = socket;
      });
    } catch (err: any) {
      console.error('[LocalClient] Connection error:', err);
      setError(err.message || 'Failed to connect');
      return false;
    }
  };

  const disconnect = () => {
    if (clientSocket) {
      try {
        clientSocket.destroy();
      } catch (e) {
        console.error('[LocalClient] Error disconnecting:', e);
      }
      clientSocket = null;
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  const sendMessage = async (msg: any) => {
    if (!clientSocket) {
      const connected = await connect();
      if (!connected) {
        throw new Error('Not connected to server');
      }
    }

    try {
      const msgStr = JSON.stringify(msg) + '\n';
      clientSocket.write(msgStr);
      console.log('[LocalClient] Sent:', msg);
    } catch (err) {
      console.error('[LocalClient] Failed to send message:', err);
      throw err;
    }
  };

  const addMessageListener = (handler: MessageHandler) => {
    messageListeners.add(handler);
    return () => {
      messageListeners.delete(handler);
    };
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    sendMessage,
    addMessageListener,
  };
}
