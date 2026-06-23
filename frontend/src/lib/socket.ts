import { io, type Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

export function connectRealtimeSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(`${WS_URL}/realtime`, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  return socket;
}

export function getRealtimeSocket(): Socket | null {
  return socket;
}

export function disconnectRealtimeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
