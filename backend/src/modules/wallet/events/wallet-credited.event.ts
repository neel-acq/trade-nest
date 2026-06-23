import { BaseDomainEvent } from '@/common/events/domain-event.interface';
import { WALLET_EVENTS } from './wallet.events';

export class WalletCreditedEvent extends BaseDomainEvent {
  constructor(payload: {
    userId: string;
    amount: number;
    balance: number;
    reason?: string;
  }) {
    super(WALLET_EVENTS.WALLET_CREDITED, payload);
  }
}
