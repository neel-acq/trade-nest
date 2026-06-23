import { BaseDomainEvent } from '@/common/events/domain-event.interface';
import { STOCK_EVENTS } from './stock.events';

export class StockCreatedEvent extends BaseDomainEvent {
  constructor(payload: { stockId: string; symbol: string; companyName: string }) {
    super(STOCK_EVENTS.STOCK_CREATED, payload);
  }
}
