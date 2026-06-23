/**
 * Base domain event contract.
 * All module events must extend this interface.
 * Business logic must depend on events, not transport (EventEmitter → Kafka later).
 */
export interface DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: Record<string, unknown>;
}

export abstract class BaseDomainEvent implements DomainEvent {
  readonly occurredAt = new Date();

  constructor(
    readonly eventName: string,
    readonly payload: Record<string, unknown>,
  ) {}
}
