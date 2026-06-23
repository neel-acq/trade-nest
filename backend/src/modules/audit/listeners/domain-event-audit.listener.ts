import { Injectable, Logger } from '@nestjs/common';
import { LogType } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@/common/events/domain-event.interface';
import { AUTH_EVENTS } from '../../auth/events/auth.events';
import { ORDER_EVENTS } from '../../order/events/order.events';
import { STOCK_EVENTS } from '../../stock/events/stock.events';
import { TRADE_EVENTS } from '../../trade/events/trade.events';
import { USER_EVENTS } from '../../user/events/user.events';
import { WALLET_EVENTS } from '../../wallet/events/wallet.events';
import { AuditService } from '../services/audit.service';

@Injectable()
export class DomainEventAuditListener {
  private readonly logger = new Logger(DomainEventAuditListener.name);

  constructor(private readonly auditService: AuditService) {}

  @OnEvent(AUTH_EVENTS.LOGIN_SUCCESS)
  handleLoginSuccess(event: DomainEvent) {
    this.safeRecord(event, {
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: event.payload.userId as string,
      logType: LogType.SECURITY,
    });
  }

  @OnEvent(AUTH_EVENTS.LOGIN_FAILED)
  handleLoginFailed(event: DomainEvent) {
    this.safeRecord(event, {
      action: 'LOGIN_FAILED',
      entityType: 'User',
      logType: LogType.SECURITY,
    });
  }

  @OnEvent(USER_EVENTS.USER_CREATED)
  handleUserCreated(event: DomainEvent) {
    this.safeRecord(event, {
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: event.payload.userId as string,
    });
  }

  @OnEvent(USER_EVENTS.USER_UPDATED)
  handleUserUpdated(event: DomainEvent) {
    this.safeRecord(event, {
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: event.payload.userId as string,
    });
  }

  @OnEvent(STOCK_EVENTS.STOCK_CREATED)
  handleStockCreated(event: DomainEvent) {
    this.safeRecord(event, {
      action: 'STOCK_CREATED',
      entityType: 'Stock',
      entityId: event.payload.stockId as string,
    });
  }

  @OnEvent(STOCK_EVENTS.STOCK_UPDATED)
  handleStockUpdated(event: DomainEvent) {
    this.safeRecord(event, {
      action: 'STOCK_UPDATED',
      entityType: 'Stock',
      entityId: event.payload.stockId as string,
    });
  }

  @OnEvent(WALLET_EVENTS.WALLET_CREDITED)
  @OnEvent(WALLET_EVENTS.WALLET_DEBITED)
  @OnEvent(WALLET_EVENTS.WALLET_LOCKED)
  @OnEvent(WALLET_EVENTS.WALLET_UNLOCKED)
  handleWalletEvent(event: DomainEvent) {
    this.safeRecord(event, {
      action: event.eventName.toUpperCase(),
      entityType: 'Wallet',
      entityId: event.payload.userId as string,
    });
  }

  @OnEvent(ORDER_EVENTS.ORDER_CREATED)
  handleOrderCreated(event: DomainEvent) {
    this.safeRecord(event, {
      action: 'ORDER_CREATED',
      entityType: 'Order',
      entityId: event.payload.orderId as string,
    });
  }

  @OnEvent(ORDER_EVENTS.ORDER_CANCELLED)
  handleOrderCancelled(event: DomainEvent) {
    this.safeRecord(event, {
      action: 'ORDER_CANCELLED',
      entityType: 'Order',
      entityId: event.payload.orderId as string,
    });
  }

  @OnEvent(TRADE_EVENTS.TRADE_EXECUTED)
  handleTradeExecuted(event: DomainEvent) {
    this.safeRecord(event, {
      action: 'TRADE_EXECUTED',
      entityType: 'Trade',
      entityId: event.payload.tradeId as string,
      logType: LogType.SUCCESS,
    });
  }

  private safeRecord(
    event: DomainEvent,
    options: {
      action: string;
      entityType?: string;
      entityId?: string;
      logType?: LogType;
    },
  ) {
    try {
      this.auditService.recordFromDomainEvent(event.eventName, event.payload, options);
    } catch (error) {
      this.logger.error(`Failed to persist audit log for ${event.eventName}`, error);
    }
  }
}
