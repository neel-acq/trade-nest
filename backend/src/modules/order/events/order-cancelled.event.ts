import { BaseDomainEvent } from '@/common/events/domain-event.interface';
import { ORDER_EVENTS } from './order.events';

export class OrderCancelledEvent extends BaseDomainEvent {
  constructor(payload: {
    orderId: string;
    userId: string;
    stockId: string;
    type: string;
    quantity: number;
    filledQuantity: number;
  }) {
    super(ORDER_EVENTS.ORDER_CANCELLED, payload);
  }
}
