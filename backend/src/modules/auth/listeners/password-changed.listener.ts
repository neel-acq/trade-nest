import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { USER_EVENTS } from '../../user/events/user.events';
import { DomainEvent } from '@/common/events/domain-event.interface';
import { SessionService } from '../services/session.service';

@Injectable()
export class PasswordChangedListener {
  constructor(private readonly sessionService: SessionService) {}

  @OnEvent(USER_EVENTS.USER_UPDATED)
  async handleUserUpdated(event: DomainEvent) {
    const updatedFields = event.payload.updatedFields as string[];
    const userId = event.payload.userId as string;

    if (updatedFields?.includes('password')) {
      await this.sessionService.invalidateAllUserSessions(userId);
    }
  }
}
