import { BaseDomainEvent } from '@/common/events/domain-event.interface';
import { USER_EVENTS } from './user.events';

export class UserCreatedEvent extends BaseDomainEvent {
  constructor(payload: {
    userId: string;
    username: string;
    role: UserRole | string;
    isSystemGenerated?: boolean;
  }) {
    super(USER_EVENTS.USER_CREATED, payload);
  }
}
