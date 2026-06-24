'use client';

import { useEffect, useRef } from 'react';
import { useRealtimeStatus } from '@/components/realtime/realtime-provider';
import { CLIENT_EVENTS, REALTIME_EVENTS } from '@/lib/realtime-events';
import { getRealtimeSocket } from '@/lib/socket';

export interface StockPriceUpdate {
  symbol: string;
  currentPrice: number;
  changePrice?: number;
  changePercentage?: number;
  price?: number;
}

export type StockRealtimeEvent =
  | { type: 'price'; data: StockPriceUpdate }
  | { type: 'trade'; data: { symbol?: string } }
  | { type: 'orderbook'; data: { symbol?: string } };

export function useStockRealtime(
  symbol: string,
  onUpdate: (event: StockRealtimeEvent) => void,
) {
  const { connected } = useRealtimeStatus();
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    const normalized = symbol?.toUpperCase();
    if (!normalized || !connected) return;

    const socket = getRealtimeSocket();
    if (!socket) return;

    const matches = (payload: { symbol?: string }) =>
      !payload?.symbol || payload.symbol.toUpperCase() === normalized;

    const handlePrice = (payload: StockPriceUpdate & { symbol?: string }) => {
      if (!matches(payload)) return;
      callbackRef.current({
        type: 'price',
        data: {
          symbol: normalized,
          currentPrice: Number(payload.currentPrice ?? payload.price ?? 0),
          changePrice: payload.changePrice,
          changePercentage: payload.changePercentage,
          price: payload.price,
        },
      });
    };

    const handleTrade = (payload: { symbol?: string }) => {
      if (!matches(payload)) return;
      callbackRef.current({ type: 'trade', data: payload });
    };

    const handleOrderBook = (payload: { symbol?: string }) => {
      if (!matches(payload)) return;
      callbackRef.current({ type: 'orderbook', data: payload });
    };

    socket.emit(CLIENT_EVENTS.SUBSCRIBE_STOCK, { symbol: normalized });
    socket.on(REALTIME_EVENTS.STOCK_PRICE, handlePrice);
    socket.on(REALTIME_EVENTS.TRADE_EXECUTED, handleTrade);
    socket.on(REALTIME_EVENTS.ORDERBOOK_UPDATED, handleOrderBook);

    return () => {
      socket.emit(CLIENT_EVENTS.UNSUBSCRIBE_STOCK, { symbol: normalized });
      socket.off(REALTIME_EVENTS.STOCK_PRICE, handlePrice);
      socket.off(REALTIME_EVENTS.TRADE_EXECUTED, handleTrade);
      socket.off(REALTIME_EVENTS.ORDERBOOK_UPDATED, handleOrderBook);
    };
  }, [symbol, connected]);
}

export function useMarketsRealtime(
  symbols: string[],
  onPriceUpdate: (update: StockPriceUpdate) => void,
) {
  const { connected } = useRealtimeStatus();
  const callbackRef = useRef(onPriceUpdate);
  callbackRef.current = onPriceUpdate;
  const symbolsKey = symbols.map((s) => s.toUpperCase()).sort().join(',');

  useEffect(() => {
    if (!symbolsKey || !connected) return;

    const socket = getRealtimeSocket();
    if (!socket) return;

    const subscribed = symbolsKey.split(',').filter(Boolean);

    const handlePrice = (payload: StockPriceUpdate & { symbol?: string }) => {
      if (!payload?.symbol) return;
      const symbol = payload.symbol.toUpperCase();
      if (!subscribed.includes(symbol)) return;
      callbackRef.current({
        symbol,
        currentPrice: Number(payload.currentPrice ?? payload.price ?? 0),
        changePrice: payload.changePrice,
        changePercentage: payload.changePercentage,
      });
    };

    for (const symbol of subscribed) {
      socket.emit(CLIENT_EVENTS.SUBSCRIBE_STOCK, { symbol });
    }
    socket.on(REALTIME_EVENTS.STOCK_PRICE, handlePrice);

    return () => {
      socket.off(REALTIME_EVENTS.STOCK_PRICE, handlePrice);
      for (const symbol of subscribed) {
        socket.emit(CLIENT_EVENTS.UNSUBSCRIBE_STOCK, { symbol });
      }
    };
  }, [symbolsKey, connected]);
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
