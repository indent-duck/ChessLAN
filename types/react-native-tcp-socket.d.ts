declare module 'react-native-tcp-socket' {
  export interface TcpSocketOptions {
    host?: string;
    port?: number;
    localAddress?: string;
    localPort?: number;
    interface?: string;
  }

  export interface TcpSocket {
    write(data: string | Buffer, encoding?: string): boolean;
    destroy(): void;
    end(data?: string | Buffer, encoding?: string): void;
    on(event: 'data', listener: (data: Buffer) => void): void;
    on(event: 'error', listener: (error: Error) => void): void;
    on(event: 'close', listener: () => void): void;
    on(event: 'connect', listener: () => void): void;
    readyState: 'opening' | 'open' | 'readOnly' | 'writeOnly';
  }

  export interface TcpServer {
    listen(options: { port: number; host?: string }, callback?: () => void): void;
    close(callback?: () => void): void;
    on(event: 'error', listener: (error: Error) => void): void;
    on(event: 'connection', listener: (socket: TcpSocket) => void): void;
  }

  export function createConnection(
    options: TcpSocketOptions,
    callback?: () => void
  ): TcpSocket;

  export function createServer(
    connectionListener?: (socket: TcpSocket) => void
  ): TcpServer;

  const TcpSocket: {
    createConnection: typeof createConnection;
    createServer: typeof createServer;
  };

  export default TcpSocket;
}
