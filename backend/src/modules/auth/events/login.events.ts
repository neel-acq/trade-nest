import { BaseDomainEvent } from '@/common/events/domain-event.interface';
import { AUTH_EVENTS } from '../events/auth.events';

export class LoginSuccessEvent extends BaseDomainEvent {
  constructor(payload: { userId: string; username: string; role: string }) {
    super(AUTH_EVENTS.LOGIN_SUCCESS, payload);
  }
}

export class LoginFailedEvent extends BaseDomainEvent {
  constructor(payload: { username: string; reason: string }) {
    super(AUTH_EVENTS.LOGIN_FAILED, payload);
  }
}
