import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@/common/events/domain-event.interface';
import { ORDER_EVENTS } from '../../order/events/order.events';
import { StockService } from '../../stock/services/stock.service';
import { TRADE_EVENTS } from '../../trade/events/trade.events';
import { WALLET_EVENTS } from '../../wallet/events/wallet.events';
import { REALTIME_EVENTS } from '../realtime.events';
import { RealtimeBroadcastService } from '../services/realtime-broadcast.service';

@Injectable()
export class DomainEventRealtimeListener {
  private readonly logger = new Logger(DomainEventRealtimeListener.name);

  constructor(
    private readonly broadcast: RealtimeBroadcastService,
    private readonly stockService: StockService,
  ) {}

  @OnEvent(ORDER_EVENTS.ORDER_CREATED)
  async handleOrderCreated(event: DomainEvent) {
    const userId = event.payload.userId as string;
    const stockId = event.payload.stockId as string;

    try {
      const stock = await this.stockService.getStockById(stockId);
      const payload = {
        ...event.payload,
        symbol: stock.symbol,
        occurredAt: event.occurredAt.toISOString(),
      };

      this.broadcast.emitToUser(userId, REALTIME_EVENTS.ORDER_CREATED, payload);
      this.broadcast.emitOrderBookUpdated(stock.symbol);
    } catch (error) {
      this.logger.warn(`Failed to broadcast order created for stock ${stockId}`, error);
    }
  }

  @OnEvent(ORDER_EVENTS.ORDER_CANCELLED)
  async handleOrderCancelled(event: DomainEvent) {
    const userId = event.payload.userId as string;
    const stockId = event.payload.stockId as string;

    try {
      const stock = await this.stockService.getStockById(stockId);
      const payload = {
        ...event.payload,
        symbol: stock.symbol,
        occurredAt: event.occurredAt.toISOString(),
      };

      this.broadcast.emitToUser(userId, REALTIME_EVENTS.ORDER_CANCELLED, payload);
      this.broadcast.emitOrderBookUpdated(stock.symbol);
    } catch (error) {
      this.logger.warn(`Failed to broadcast order cancelled for stock ${stockId}`, error);
    }
  }

  @OnEvent(TRADE_EVENTS.TRADE_EXECUTED)
  async handleTradeExecuted(event: DomainEvent) {
    const stockId = event.payload.stockId as string;
    const price = event.payload.price as number;
    const symbolFromPayload = event.payload.symbol as string | undefined;
    const buyUserId = event.payload.buyUserId as string | undefined;
    const sellUserId = event.payload.sellUserId as string | undefined;

    try {
      const stock = symbolFromPayload
        ? { symbol: symbolFromPayload, currentPrice: price }
        : await this.stockService.getStockById(stockId);
      const payload = {
        ...event.payload,
        symbol: stock.symbol,
        occurredAt: event.occurredAt.toISOString(),
      };

      this.broadcast.emitToStock(stock.symbol, REALTIME_EVENTS.TRADE_EXECUTED, payload);
      this.broadcast.emitStockPrice(stock.symbol, {
        symbol: stock.symbol,
        stockId,
        price,
        currentPrice: Number(stock.currentPrice ?? price),
        timestamp: event.occurredAt.toISOString(),
      });
      this.broadcast.emitOrderBookUpdated(stock.symbol);

      if (buyUserId) {
        this.broadcast.emitToUser(buyUserId, REALTIME_EVENTS.TRADE_EXECUTED, {
          ...payload,
          side: 'BUY',
        });
      }
      if (sellUserId) {
        this.broadcast.emitToUser(sellUserId, REALTIME_EVENTS.TRADE_EXECUTED, {
          ...payload,
          side: 'SELL',
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to broadcast trade for stock ${stockId}`, error);
    }
  }

  @OnEvent(WALLET_EVENTS.WALLET_CREDITED)
  @OnEvent(WALLET_EVENTS.WALLET_DEBITED)
  @OnEvent(WALLET_EVENTS.WALLET_LOCKED)
  @OnEvent(WALLET_EVENTS.WALLET_UNLOCKED)
  handleWalletUpdated(event: DomainEvent) {
    const userId = event.payload.userId as string;
    if (!userId) return;

    this.broadcast.emitToUser(userId, REALTIME_EVENTS.WALLET_UPDATED, {
      ...event.payload,
      eventName: event.eventName,
      occurredAt: event.occurredAt.toISOString(),
    });
  }
}
