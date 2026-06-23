import { BaseDomainEvent } from '@/common/events/domain-event.interface';
import { ORDER_EVENTS } from './order.events';

export class OrderCreatedEvent extends BaseDomainEvent {
  constructor(payload: {
    orderId: string;
    userId: string;
    stockId: string;
    type: string;
    quantity: number;
    price?: number;
  }) {
    super(ORDER_EVENTS.ORDER_CREATED, payload);
  }
}
