import { getServerUrl } from "../config";

type MsgHandler = (msg: any) => void;

let socket: WebSocket | null = null;
const listeners: Set<MsgHandler> = new Set();
let connectionPromise: Promise<WebSocket> | null = null;

export async function getSocket(): Promise<WebSocket> {
  // If we have an open socket, return it
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  // Create new connection
  connectionPromise = new Promise(async (resolve, reject) => {
    try {
      const url = await getServerUrl();
      console.log("Connecting to:", url);
      socket = new WebSocket(url);
      
      socket.onopen = () => {
        console.log("WebSocket connected");
        connectionPromise = null;
        resolve(socket!);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        connectionPromise = null;
        reject(error);
      };

      socket.onclose = () => {
        console.log("WebSocket closed");
        socket = null;
        connectionPromise = null;
      };

      socket.onmessage = (e) => {
        let msg: any;
        try { 
          msg = JSON.parse(e.data);
          console.log("Received message:", msg);
        } catch { 
          return; 
        }
        listeners.forEach((fn) => fn(msg));
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      connectionPromise = null;
      reject(error);
    }
  });

  return connectionPromise;
}

export function closeSocket() {
  socket?.close();
  socket = null;
  connectionPromise = null;
  listeners.clear();
}

export async function sendMsg(msg: object) {
  try {
    const ws = await getSocket();
    
    // Wait for connection to be ready
    if (ws.readyState === WebSocket.CONNECTING) {
      await new Promise((resolve) => {
        ws.addEventListener("open", resolve, { once: true });
      });
    }

    if (ws.readyState === WebSocket.OPEN) {
      console.log("Sending message:", msg);
      ws.send(JSON.stringify(msg));
    } else {
      console.error("WebSocket not open. State:", ws.readyState);
    }
  } catch (error) {
    console.error("Failed to send message:", error);
  }
}

export function addListener(fn: MsgHandler) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

