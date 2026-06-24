import { Injectable, Logger } from '@nestjs/common';
import { LogType } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@/common/events/domain-event.interface';
import { AUTH_EVENTS } from '../../auth/events/auth.events';
import { ORDER_EVENTS } from '../../order/events/order.events';
import { STOCK_EVENTS } from '../../stock/events/stock.events';
import { TRADE_EVENTS } from '../../trade/events/trade.events';
import { SystemService } from '../services/system.service';

@Injectable()
export class DomainEventSystemListener {
  private readonly logger = new Logger(DomainEventSystemListener.name);

  constructor(private readonly systemService: SystemService) {}

  @OnEvent(AUTH_EVENTS.LOGIN_SUCCESS)
  handleLoginSuccess(event: DomainEvent) {
    this.safeInfo('User logged in', 'auth.login', event.payload);
  }

  @OnEvent(AUTH_EVENTS.LOGIN_FAILED)
  handleLoginFailed(event: DomainEvent) {
    this.safeWarning('Login attempt failed', 'auth.login', event.payload);
  }

  @OnEvent(ORDER_EVENTS.ORDER_CREATED)
  handleOrderCreated(event: DomainEvent) {
    this.safeInfo(
      `Order created: ${event.payload.orderId}`,
      'order.lifecycle',
      event.payload,
    );
  }

  @OnEvent(ORDER_EVENTS.ORDER_CANCELLED)
  handleOrderCancelled(event: DomainEvent) {
    this.safeInfo(
      `Order cancelled: ${event.payload.orderId}`,
      'order.lifecycle',
      event.payload,
    );
  }

  @OnEvent(STOCK_EVENTS.STOCK_UPDATED)
  handleStockUpdated(event: DomainEvent) {
    const updatedFields = event.payload.updatedFields as string[] | undefined;
    if (!updatedFields?.includes('currentPrice')) return;

    this.safeInfo(
      `Stock price updated: ${event.payload.symbol}`,
      'stock.price',
      event.payload,
      LogType.INFO,
    );
  }

  @OnEvent(TRADE_EVENTS.TRADE_EXECUTED)
  handleTradeExecuted(event: DomainEvent) {
    const tradeId = event.payload.tradeId as string;
    const symbol = event.payload.symbol as string | undefined;
    this.safeInfo(
      `Trade executed: ${tradeId}${symbol ? ` (${symbol})` : ''}`,
      'trade.execution',
      event.payload,
      LogType.SUCCESS,
    );
  }

  private safeInfo(
    message: string,
    context: string,
    metadata: Record<string, unknown>,
    logType: LogType = LogType.INFO,
  ) {
    try {
      this.systemService.record({ message, context, metadata, logType });
    } catch (error) {
      this.logger.error(`Failed to persist system log: ${message}`, error);
    }
  }

  private safeWarning(message: string, context: string, metadata: Record<string, unknown>) {
    try {
      this.systemService.warning(message, context, metadata);
    } catch (error) {
      this.logger.error(`Failed to persist system log: ${message}`, error);
    }
  }
}
