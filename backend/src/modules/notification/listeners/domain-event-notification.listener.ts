import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@/common/events/domain-event.interface';
import { ORDER_EVENTS } from '../../order/events/order.events';
import { TRADE_EVENTS } from '../../trade/events/trade.events';
import { WALLET_EVENTS } from '../../wallet/events/wallet.events';
import { NotificationService } from '../services/notification.service';

function formatInr(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatOrderType(type: string) {
  return type.replace(/_/g, ' ').toLowerCase();
}

@Injectable()
export class DomainEventNotificationListener {
  private readonly logger = new Logger(DomainEventNotificationListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(ORDER_EVENTS.ORDER_CREATED)
  handleOrderCreated(event: DomainEvent) {
    const { orderId, userId, type, quantity } = event.payload as {
      orderId: string;
      userId: string;
      type: string;
      quantity: number;
    };

    this.safeNotify({
      userId,
      type: NotificationType.ORDER,
      title: 'Order placed',
      message: `Your ${formatOrderType(type)} order for ${quantity} shares was placed.`,
      link: '/orders',
      metadata: { orderId, eventName: event.eventName },
    });
  }

  @OnEvent(ORDER_EVENTS.ORDER_CANCELLED)
  handleOrderCancelled(event: DomainEvent) {
    const { orderId, userId, type, quantity, filledQuantity } = event.payload as {
      orderId: string;
      userId: string;
      type: string;
      quantity: number;
      filledQuantity: number;
    };

    const unfilled = quantity - filledQuantity;
    this.safeNotify({
      userId,
      type: NotificationType.ORDER,
      title: 'Order cancelled',
      message:
        filledQuantity > 0
          ? `Your ${formatOrderType(type)} order was cancelled (${unfilled} unfilled shares released).`
          : `Your ${formatOrderType(type)} order for ${quantity} shares was cancelled.`,
      link: '/orders',
      metadata: { orderId, eventName: event.eventName },
    });
  }

  @OnEvent(TRADE_EVENTS.TRADE_EXECUTED)
  handleTradeExecuted(event: DomainEvent) {
    const { tradeId, symbol, quantity, price, buyUserId, sellUserId } = event.payload as {
      tradeId: string;
      symbol?: string;
      quantity: number;
      price: number;
      buyUserId?: string;
      sellUserId?: string;
    };

    const stockLabel = symbol ? symbol.toUpperCase() : 'stock';
    const tradeSummary = `${quantity} ${stockLabel} @ ${formatInr(price)}`;

    if (buyUserId) {
      this.safeNotify({
        userId: buyUserId,
        type: NotificationType.TRADE,
        title: 'Trade executed (buy)',
        message: `You bought ${tradeSummary}.`,
        link: '/trades',
        metadata: { tradeId, side: 'BUY', eventName: event.eventName },
      });
    }

    if (sellUserId) {
      this.safeNotify({
        userId: sellUserId,
        type: NotificationType.TRADE,
        title: 'Trade executed (sell)',
        message: `You sold ${tradeSummary}.`,
        link: '/trades',
        metadata: { tradeId, side: 'SELL', eventName: event.eventName },
      });
    }
  }

  @OnEvent(WALLET_EVENTS.WALLET_CREDITED)
  handleWalletCredited(event: DomainEvent) {
    const { userId, amount, balance, reason } = event.payload as {
      userId: string;
      amount: number;
      balance: number;
      reason?: string;
    };

    this.safeNotify({
      userId,
      type: NotificationType.WALLET,
      title: 'Wallet credited',
      message: `${formatInr(amount)} added to your wallet${reason ? ` (${reason})` : ''}. New balance: ${formatInr(balance)}.`,
      link: '/wallet',
      metadata: { amount, balance, eventName: event.eventName },
    });
  }

  @OnEvent(WALLET_EVENTS.WALLET_DEBITED)
  handleWalletDebited(event: DomainEvent) {
    const { userId, amount, balance, reason } = event.payload as {
      userId: string;
      amount: number;
      balance: number;
      reason?: string;
    };

    this.safeNotify({
      userId,
      type: NotificationType.WALLET,
      title: 'Wallet debited',
      message: `${formatInr(amount)} deducted from your wallet${reason ? ` (${reason})` : ''}. New balance: ${formatInr(balance)}.`,
      link: '/wallet',
      metadata: { amount, balance, eventName: event.eventName },
    });
  }

  @OnEvent(WALLET_EVENTS.WALLET_LOCKED)
  handleWalletLocked(event: DomainEvent) {
    const { userId, amount, availableBalance } = event.payload as {
      userId: string;
      amount: number;
      availableBalance: number;
    };

    this.safeNotify({
      userId,
      type: NotificationType.WALLET,
      title: 'Funds locked',
      message: `${formatInr(amount)} locked for a pending order. Available balance: ${formatInr(availableBalance)}.`,
      link: '/wallet',
      metadata: { amount, availableBalance, eventName: event.eventName },
    });
  }

  @OnEvent(WALLET_EVENTS.WALLET_UNLOCKED)
  handleWalletUnlocked(event: DomainEvent) {
    const { userId, amount, availableBalance } = event.payload as {
      userId: string;
      amount: number;
      availableBalance: number;
    };

    this.safeNotify({
      userId,
      type: NotificationType.WALLET,
      title: 'Funds unlocked',
      message: `${formatInr(amount)} released back to your wallet. Available balance: ${formatInr(availableBalance)}.`,
      link: '/wallet',
      metadata: { amount, availableBalance, eventName: event.eventName },
    });
  }

  private safeNotify(data: Parameters<NotificationService['createAndNotify']>[0]) {
    this.notificationService.createAndNotify(data).catch((error) => {
      this.logger.error(`Failed to create notification for user ${data.userId}`, error);
    });
  }
}
