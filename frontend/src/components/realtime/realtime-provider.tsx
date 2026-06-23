'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { connectRealtimeSocket, disconnectRealtimeSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

interface RealtimeContextValue {
  connected: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue>({ connected: false });

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.accessToken);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      disconnectRealtimeSocket();
      setConnected(false);
      return;
    }

    const socket = connectRealtimeSocket(token);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      disconnectRealtimeSocket();
      setConnected(false);
    };
  }, [token]);

  const value = useMemo(() => ({ connected }), [connected]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeStatus() {
  return useContext(RealtimeContext);
}
