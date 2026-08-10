import { SERVER_URL } from "../config";

type MsgHandler = (msg: any) => void;

let socket: WebSocket | null = null;
const listeners: Set<MsgHandler> = new Set();

export function getSocket(): WebSocket {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    socket = new WebSocket(SERVER_URL);
    socket.onmessage = (e) => {
      let msg: any;
      try { msg = JSON.parse(e.data); } catch { return; }
      listeners.forEach((fn) => fn(msg));
    };
  }
  return socket;
}

export function closeSocket() {
  socket?.close();
  socket = null;
  listeners.clear();
}

export function sendMsg(msg: object) {
  const ws = getSocket();
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  } else {
    ws.addEventListener("open", () => ws.send(JSON.stringify(msg)), { once: true });
  }
}

export function addListener(fn: MsgHandler) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
