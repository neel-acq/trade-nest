import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DomainEventBus } from '@/common/events/domain-event-bus.service';
import { UserService } from '../../user/services/user.service';
import { WalletLockedEvent } from '../events/wallet-balance.events';
import { WalletCreditedEvent } from '../events/wallet-credited.event';
import { WalletRepository } from '../repositories/wallet.repository';
import { WalletService } from '../services/wallet.service';

describe('WalletService', () => {
  let service: WalletService;
  let walletRepository: jest.Mocked<
    Pick<WalletRepository, 'findByUserId' | 'mutateBalances' | 'countSystemGenerated'>
  >;
  let eventBus: jest.Mocked<Pick<DomainEventBus, 'publish'>>;

  const mockWallet = {
    id: 'wallet-1',
    userId: 'user-1',
    balance: 1000000,
    lockedBalance: 0,
    isSystemGenerated: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(async () => {
    walletRepository = {
      findByUserId: jest.fn(),
      mutateBalances: jest.fn(),
      countSystemGenerated: jest.fn(),
    };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: WalletRepository, useValue: walletRepository },
        { provide: UserService, useValue: { findSystemUsers: jest.fn(), findById: jest.fn() } },
        { provide: DomainEventBus, useValue: eventBus },
      ],
    }).compile();

    service = module.get(WalletService);
  });

  it('credits wallet and publishes event', async () => {
    walletRepository.mutateBalances.mockResolvedValue({
      ...mockWallet,
      balance: 1000500,
    } as never);

    const result = await service.credit('user-1', 500);

    expect(result.balance).toBe(1000500);
    expect(eventBus.publish).toHaveBeenCalledWith(expect.any(WalletCreditedEvent));
  });

  it('locks funds and publishes WalletLocked event', async () => {
    walletRepository.mutateBalances.mockResolvedValue({
      ...mockWallet,
      lockedBalance: 10000,
    } as never);

    await service.lockFunds('user-1', 10000);

    expect(eventBus.publish).toHaveBeenCalledWith(expect.any(WalletLockedEvent));
  });

  it('rejects debit when insufficient funds', async () => {
    walletRepository.mutateBalances.mockRejectedValue(
      new BadRequestException('Insufficient available balance'),
    );

    await expect(service.debit('user-1', 9999999)).rejects.toThrow(BadRequestException);
  });
});
