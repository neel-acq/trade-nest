import { Global, Module } from '@nestjs/common';
import { DomainEventBus } from './domain-event-bus.service';
import { EventStoreListener } from './event-store.listener';

@Global()
@Module({
  providers: [DomainEventBus, EventStoreListener],
  exports: [DomainEventBus],
})
export class EventsModule {}
