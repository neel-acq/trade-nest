import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@/common/events/domain-event.interface';
import { USER_EVENTS } from '../../user/events/user.events';
import { WalletService } from '../services/wallet.service';

@Injectable()
export class UserCreatedListener {
  constructor(private readonly walletService: WalletService) {}

  @OnEvent(USER_EVENTS.USER_CREATED)
  async handleUserCreated(event: DomainEvent) {
    const userId = event.payload.userId as string;
    const isSystemGenerated = Boolean(event.payload.isSystemGenerated);
    await this.walletService.createWalletForUser(userId, isSystemGenerated);
  }
}
