import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@/common/events/domain-event.interface';
import { ORDER_EVENTS } from '../../order/events/order.events';
import { MatchingEngineService } from '../services/matching-engine.service';

@Injectable()
export class OrderCreatedMatchingListener {
  private readonly logger = new Logger(OrderCreatedMatchingListener.name);

  constructor(private readonly matchingEngine: MatchingEngineService) {}

  @OnEvent(ORDER_EVENTS.ORDER_CREATED)
  async handleOrderCreated(event: DomainEvent) {
    const orderId = event.payload.orderId as string;
    try {
      const result = await this.matchingEngine.processOrder(orderId);
      if (result.tradesExecuted > 0) {
        this.logger.log(
          `Matched order ${orderId}: ${result.tradesExecuted} trade(s), ${result.totalQuantityFilled} shares`,
        );
      }
    } catch (error) {
      this.logger.error(`Matching failed for order ${orderId}`, error);
    }
  }
}
