import { getServerUrl } from "../config";

type MsgHandler = (msg: any) => void;

let socket: WebSocket | null = null;
const listeners: Set<MsgHandler> = new Set();

export async function getSocket(): Promise<WebSocket> {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    const url = await getServerUrl();
    socket = new WebSocket(url);
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

export async function sendMsg(msg: object) {
  const ws = await getSocket();
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
