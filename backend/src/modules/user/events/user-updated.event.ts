import { BaseDomainEvent } from '@/common/events/domain-event.interface';
import { USER_EVENTS } from './user.events';

export class UserUpdatedEvent extends BaseDomainEvent {
  constructor(payload: { userId: string; username: string; updatedFields: string[] }) {
    super(USER_EVENTS.USER_UPDATED, payload);
  }
}
