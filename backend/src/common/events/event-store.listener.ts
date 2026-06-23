import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from './domain-event.interface';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_EVENTS } from '../../modules/auth/events/auth.events';
import { USER_EVENTS } from '../../modules/user/events/user.events';
import { STOCK_EVENTS } from '../../modules/stock/events/stock.events';
import { WALLET_EVENTS } from '../../modules/wallet/events/wallet.events';
import { ORDER_EVENTS } from '../../modules/order/events/order.events';
import { TRADE_EVENTS } from '../../modules/trade/events/trade.events';

@Injectable()
export class EventStoreListener {
  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(AUTH_EVENTS.LOGIN_SUCCESS)
  @OnEvent(AUTH_EVENTS.LOGIN_FAILED)
  @OnEvent(USER_EVENTS.USER_CREATED)
  @OnEvent(USER_EVENTS.USER_UPDATED)
  @OnEvent(STOCK_EVENTS.STOCK_CREATED)
  @OnEvent(STOCK_EVENTS.STOCK_UPDATED)
  @OnEvent(WALLET_EVENTS.WALLET_CREDITED)
  @OnEvent(WALLET_EVENTS.WALLET_DEBITED)
  @OnEvent(WALLET_EVENTS.WALLET_LOCKED)
  @OnEvent(WALLET_EVENTS.WALLET_UNLOCKED)
  @OnEvent(ORDER_EVENTS.ORDER_CREATED)
  @OnEvent(ORDER_EVENTS.ORDER_CANCELLED)
  @OnEvent(TRADE_EVENTS.TRADE_EXECUTED)
  async persistDomainEvent(event: DomainEvent) {
    await this.prisma.eventStore.create({
      data: {
        eventName: event.eventName,
        payload: event.payload as object,
        isSystemGenerated: true,
      },
    });
  }
}
