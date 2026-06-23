'use client';

import { useEffect, useRef } from 'react';
import { useRealtimeStatus } from '@/components/realtime/realtime-provider';
import { CLIENT_EVENTS, REALTIME_EVENTS } from '@/lib/realtime-events';
import { getRealtimeSocket } from '@/lib/socket';

export function useStockRealtime(symbol: string, onUpdate: () => void) {
  const { connected } = useRealtimeStatus();
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    const normalized = symbol?.toUpperCase();
    if (!normalized || !connected) return;

    const socket = getRealtimeSocket();
    if (!socket) return;

    const handleUpdate = (payload: { symbol?: string }) => {
      if (!payload?.symbol || payload.symbol.toUpperCase() === normalized) {
        callbackRef.current();
      }
    };

    socket.emit(CLIENT_EVENTS.SUBSCRIBE_STOCK, { symbol: normalized });
    socket.on(REALTIME_EVENTS.ORDERBOOK_UPDATED, handleUpdate);
    socket.on(REALTIME_EVENTS.TRADE_EXECUTED, handleUpdate);
    socket.on(REALTIME_EVENTS.STOCK_PRICE, handleUpdate);

    return () => {
      socket.emit(CLIENT_EVENTS.UNSUBSCRIBE_STOCK, { symbol: normalized });
      socket.off(REALTIME_EVENTS.ORDERBOOK_UPDATED, handleUpdate);
      socket.off(REALTIME_EVENTS.TRADE_EXECUTED, handleUpdate);
      socket.off(REALTIME_EVENTS.STOCK_PRICE, handleUpdate);
    };
  }, [symbol, connected]);
}

export function useUserRealtime(onUpdate: () => void, events: string[]) {
  const { connected } = useRealtimeStatus();
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!connected) return;

    const socket = getRealtimeSocket();
    if (!socket) return;

    const handler = () => callbackRef.current();
    for (const event of events) {
      socket.on(event, handler);
    }

    return () => {
      for (const event of events) {
        socket.off(event, handler);
      }
    };
  }, [events, connected]);
}
