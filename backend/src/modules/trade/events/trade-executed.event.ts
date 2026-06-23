import { BaseDomainEvent } from '@/common/events/domain-event.interface';
import { TRADE_EVENTS } from './trade.events';

export class TradeExecutedEvent extends BaseDomainEvent {
  constructor(payload: {
    tradeId: string;
    stockId: string;
    symbol?: string;
    quantity: number;
    price: number;
    buyUserId?: string;
    sellUserId?: string;
  }) {
    super(TRADE_EVENTS.TRADE_EXECUTED, payload);
  }
}
