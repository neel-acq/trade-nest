import { BaseDomainEvent } from '@/common/events/domain-event.interface';
import { STOCK_EVENTS } from './stock.events';

export class StockUpdatedEvent extends BaseDomainEvent {
  constructor(payload: {
    stockId: string;
    symbol: string;
    updatedFields: string[];
  }) {
    super(STOCK_EVENTS.STOCK_UPDATED, payload);
  }
}
