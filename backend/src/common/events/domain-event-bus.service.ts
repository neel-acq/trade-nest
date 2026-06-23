import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from './domain-event.interface';

@Injectable()
export class DomainEventBus {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish(event: DomainEvent): void {
    this.eventEmitter.emit(event.eventName, event);
  }

  subscribe<T extends DomainEvent>(
    eventName: string,
    handler: (event: T) => void | Promise<void>,
  ): void {
    this.eventEmitter.on(eventName, handler);
  }
}
