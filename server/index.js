const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({ port: 3001 });

// rooms: { [code]: { host: ws, guest: ws | null, hostUsername: string, guestUsername: string | null, mode: string, time: string } }
const rooms = {};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
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
      rooms[code] = { 
        host: ws, 
        guest: null, 
        hostUsername: msg.username, 
        guestUsername: null,
        mode: msg.mode || "Rapid",
        time: msg.time || "10 min"
      };
      ws._code = code;
      ws._role = "host";
      send(ws, { type: "created", code });
    }

    else if (msg.type === "join") {
      const room = rooms[msg.code];
      if (!room) return send(ws, { type: "error", message: "Room not found" });
      if (room.guest) return send(ws, { type: "error", message: "Room is full" });
      room.guest = ws;
      room.guestUsername = msg.username;
      ws._code = msg.code;
      ws._role = "guest";
      send(ws, { type: "joined", hostUsername: room.hostUsername, mode: room.mode, time: room.time });
      send(room.host, { type: "opponent_joined", guestUsername: msg.username });
    }

    else if (msg.type === "start") {
      const room = rooms[ws._code];
      if (!room || ws._role !== "host") return;
      send(room.host, { type: "game_start", flipped: msg.flipped });
      if (room.guest) send(room.guest, { type: "game_start", flipped: msg.flipped });
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
