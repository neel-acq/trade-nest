import { BaseDomainEvent } from '@/common/events/domain-event.interface';
import { WALLET_EVENTS } from './wallet.events';

export class WalletDebitedEvent extends BaseDomainEvent {
  constructor(payload: {
    userId: string;
    amount: number;
    balance: number;
    reason?: string;
  }) {
    super(WALLET_EVENTS.WALLET_DEBITED, payload);
  }
}

export class WalletLockedEvent extends BaseDomainEvent {
  constructor(payload: {
    userId: string;
    amount: number;
    lockedBalance: number;
    availableBalance: number;
    reason?: string;
  }) {
    super(WALLET_EVENTS.WALLET_LOCKED, payload);
  }
}

export class WalletUnlockedEvent extends BaseDomainEvent {
  constructor(payload: {
    userId: string;
    amount: number;
    lockedBalance: number;
    availableBalance: number;
    reason?: string;
  }) {
    super(WALLET_EVENTS.WALLET_UNLOCKED, payload);
  }
}
