import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { REALTIME_EVENTS, stockRoom, userRoom } from '../realtime.events';

@Injectable()
export class RealtimeBroadcastService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emitToUser(userId: string, event: string, payload: Record<string, unknown>) {
    this.server?.to(userRoom(userId)).emit(event, payload);
  }

  emitToStock(symbol: string, event: string, payload: Record<string, unknown>) {
    this.server?.to(stockRoom(symbol)).emit(event, payload);
  }

  emitOrderBookUpdated(symbol: string) {
    this.emitToStock(symbol, REALTIME_EVENTS.ORDERBOOK_UPDATED, {
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString(),
    });
  }

  emitStockPrice(symbol: string, payload: Record<string, unknown>) {
    this.emitToStock(symbol, REALTIME_EVENTS.STOCK_PRICE, payload);
  }
}
