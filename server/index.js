const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({ port: 3001 });

// rooms: { [code]: { host: ws, guest: ws | null, hostUsername: string, guestUsername: string | null, mode: string, time: string, variant: string, chess960Fen: string | null } }
const rooms = {};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Generate a valid Chess960 starting position
function generateChess960Position() {
  let position = new Array(8).fill(null);
  
  // Place bishops on opposite colors
  const lightSquares = [1, 3, 5, 7]; // b, d, f, h files (light)
  const darkSquares = [0, 2, 4, 6];  // a, c, e, g files (dark)
  
  const lightBishopPos = lightSquares[Math.floor(Math.random() * lightSquares.length)];
  const darkBishopPos = darkSquares[Math.floor(Math.random() * darkSquares.length)];
  
  position[lightBishopPos] = 'b';
  position[darkBishopPos] = 'b';
  
  // Get remaining empty positions
  let emptyPositions = position.map((p, i) => p === null ? i : null).filter(i => i !== null);
  
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
  
  // Build FEN string
  const backRank = position.join('');
  const fen = `${backRank}/pppppppp/8/8/8/8/PPPPPPPP/${backRank.toUpperCase()} w KQkq - 0 1`;
  
  return fen;
}

function send(ws, msg) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }

    if (msg.type === "create") {
      let code;
      do { code = generateCode(); } while (rooms[code]);
      const variant = msg.variant || "standard";
      const chess960Fen = variant === "chess960" ? generateChess960Position() : null;
      rooms[code] = { 
        host: ws, 
        guest: null, 
        hostUsername: msg.username, 
        guestUsername: null,
        mode: msg.mode || "Rapid",
        time: msg.time || "10 min",
        variant: variant,
        chess960Fen: chess960Fen
      };
      ws._code = code;
      ws._role = "host";
      send(ws, { type: "created", code, variant, chess960Fen });
    }

    else if (msg.type === "join") {
      const room = rooms[msg.code];
      if (!room) return send(ws, { type: "error", message: "Room not found" });
      if (room.guest) return send(ws, { type: "error", message: "Room is full" });
      room.guest = ws;
      room.guestUsername = msg.username;
      ws._code = msg.code;
      ws._role = "guest";
      send(ws, { type: "joined", hostUsername: room.hostUsername, mode: room.mode, time: room.time, variant: room.variant, chess960Fen: room.chess960Fen });
      send(room.host, { type: "opponent_joined", guestUsername: msg.username });
    }

    else if (msg.type === "start") {
      const room = rooms[ws._code];
      if (!room || ws._role !== "host") return;
      send(room.host, { type: "game_start", flipped: msg.flipped, variant: room.variant, chess960Fen: room.chess960Fen });
      if (room.guest) send(room.guest, { type: "game_start", flipped: msg.flipped, variant: room.variant, chess960Fen: room.chess960Fen });
    }

    else if (msg.type === "move") {
      const room = rooms[ws._code];
      if (!room) return;
      const opponent = ws._role === "host" ? room.guest : room.host;
      if (opponent) send(opponent, { type: "move", move: msg.move });
    }

    else if (msg.type === "game_over") {
      const room = rooms[ws._code];
      if (!room) return;
      const opponent = ws._role === "host" ? room.guest : room.host;
      if (opponent) send(opponent, { type: "game_over", winner: msg.winner, reason: msg.reason });
    }

    else if (msg.type === "resign") {
      const room = rooms[ws._code];
      if (!room) return;
      const opponent = ws._role === "host" ? room.guest : room.host;
      if (opponent) send(opponent, { type: "resign" });
    }

    else if (msg.type === "draw_offer") {
      const room = rooms[ws._code];
      if (!room) return;
      const opponent = ws._role === "host" ? room.guest : room.host;
      if (opponent) send(opponent, { type: "draw_offer" });
    }

    else if (msg.type === "draw_accept") {
      const room = rooms[ws._code];
      if (!room) return;
      const opponent = ws._role === "host" ? room.guest : room.host;
      if (opponent) send(opponent, { type: "draw_accept" });
    }

    else if (msg.type === "draw_decline") {
      const room = rooms[ws._code];
      if (!room) return;
      const opponent = ws._role === "host" ? room.guest : room.host;
      if (opponent) send(opponent, { type: "draw_decline" });
    }

    else if (msg.type === "abandon") {
      const room = rooms[ws._code];
      if (!room) return;
      const opponent = ws._role === "host" ? room.guest : room.host;
      if (opponent) send(opponent, { type: "abandon" });
    }

    else if (msg.type === "color_update") {
      const room = rooms[ws._code];
      if (!room || ws._role !== "host") return;
      console.log(`[Server] color_update from host, flipped=${msg.flipped}, guest exists:`, !!room.guest);
      if (room.guest) send(room.guest, { type: "color_update", flipped: msg.flipped });
    }

    else if (msg.type === "cancel") {
      const code = ws._code;
      if (!code || !rooms[code]) return;
      const room = rooms[code];
      if (room.guest) send(room.guest, { type: "room_cancelled" });
      delete rooms[code];
    }

    else if (msg.type === "leave") {
      const code = ws._code;
      if (!code || !rooms[code]) return;
      const room = rooms[code];
      if (ws._role === "guest") {
        // Guest is leaving - remove them but keep the room for host
        room.guest = null;
        room.guestUsername = null;
        if (room.host) send(room.host, { type: "guest_left" });
        ws._code = null;
        ws._role = null;
      } else if (ws._role === "host") {
        // Host is cancelling
        if (room.guest) send(room.guest, { type: "room_cancelled" });
        delete rooms[code];
      }
    }
  });

  ws.on("close", () => {
    const code = ws._code;
    if (!code || !rooms[code]) return;
    const room = rooms[code];
    if (ws._role === "guest" && room.guest === ws) {
      // Guest disconnected unexpectedly - remove them but keep the room
      room.guest = null;
      room.guestUsername = null;
      if (room.host) send(room.host, { type: "guest_left" });
      return;
    }
    if (ws._role === "host") {
      // Host disconnected - notify guest and delete room
      if (room.guest) send(room.guest, { type: "room_cancelled" });
      delete rooms[code];
      return;
    }
    // Fallback for any other disconnection scenario
    if (!room.guest) {
      delete rooms[code];
    }
  });
});

console.log("Chess server running on ws://0.0.0.0:3001");
