import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { buildPaginationMeta, PaginatedResult } from '@/common/dto/pagination.dto';
import { DomainEventBus } from '@/common/events/domain-event-bus.service';
import { INITIAL_WALLET_BALANCE } from '../../../../prisma/data/constants';
import { UserService } from '../../user/services/user.service';
import { WalletAmountDto } from '../dto/wallet-amount.dto';
import { QueryWalletsDto } from '../dto/query-wallets.dto';
import {
  SafeWallet,
  SafeWalletWithUser,
  toSafeWallet,
} from '../entities/wallet.entity';
import { WalletCreditedEvent } from '../events/wallet-credited.event';
import {
  WalletDebitedEvent,
  WalletLockedEvent,
  WalletUnlockedEvent,
} from '../events/wallet-balance.events';
import { WalletRepository } from '../repositories/wallet.repository';

@Injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly userService: UserService,
    private readonly eventBus: DomainEventBus,
  ) {}

  getStatus() {
    return { module: 'wallet', status: 'active', phase: 6 };
  }

  async getMyWallet(userId: string): Promise<SafeWallet> {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return toSafeWallet(wallet);
  }

  async getWalletByUserId(userId: string): Promise<SafeWallet> {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found for user');
    }
    return toSafeWallet(wallet);
  }

  async listWallets(query: QueryWalletsDto): Promise<PaginatedResult<SafeWalletWithUser>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { total, wallets } = await this.walletRepository.findManyPaginated({
      page,
      limit,
      search: query.search,
      minBalance: query.minBalance,
      maxBalance: query.maxBalance,
      sortBy: query.sortBy ?? 'balance',
      sortOrder: query.sortOrder ?? 'desc',
    });

    return {
      data: wallets.map((wallet) => ({
        ...toSafeWallet(wallet),
        user: wallet.user,
      })),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  /** Credit available balance (e.g. sell proceeds, admin top-up). */
  async credit(userId: string, amount: number, reason?: string) {
    const wallet = await this.walletRepository.mutateBalances(userId, (current) => ({
      balance: Number(current.balance) + amount,
      lockedBalance: Number(current.lockedBalance),
    }));

    const safe = toSafeWallet(wallet);
    this.eventBus.publish(
      new WalletCreditedEvent({
        userId,
        amount,
        balance: safe.balance,
        reason,
      }),
    );
    return safe;
  }

  /** Debit from available balance (must have sufficient available funds). */
  async debit(userId: string, amount: number, reason?: string) {
    const wallet = await this.walletRepository.mutateBalances(userId, (current) => {
      const balance = Number(current.balance);
      const locked = Number(current.lockedBalance);
      const available = balance - locked;
      if (available < amount) {
        throw new BadRequestException('Insufficient available balance');
      }
      return { balance: balance - amount, lockedBalance: locked };
    });

    const safe = toSafeWallet(wallet);
    this.eventBus.publish(
      new WalletDebitedEvent({
        userId,
        amount,
        balance: safe.balance,
        reason,
      }),
    );
    return safe;
  }

  /** Lock funds for a pending buy order. */
  async lockFunds(userId: string, amount: number, reason?: string) {
    const wallet = await this.walletRepository.mutateBalances(userId, (current) => {
      const balance = Number(current.balance);
      const locked = Number(current.lockedBalance);
      const available = balance - locked;
      if (available < amount) {
        throw new BadRequestException('Insufficient available balance to lock');
      }
      return { balance, lockedBalance: locked + amount };
    });

    const safe = toSafeWallet(wallet);
    this.eventBus.publish(
      new WalletLockedEvent({
        userId,
        amount,
        lockedBalance: safe.lockedBalance,
        availableBalance: safe.availableBalance,
        reason,
      }),
    );
    return safe;
  }

  /** Unlock funds when an order is cancelled. */
  async unlockFunds(userId: string, amount: number, reason?: string) {
    const wallet = await this.walletRepository.mutateBalances(userId, (current) => {
      const balance = Number(current.balance);
      const locked = Number(current.lockedBalance);
      if (locked < amount) {
        throw new BadRequestException('Cannot unlock more than locked balance');
      }
      return { balance, lockedBalance: locked - amount };
    });

    const safe = toSafeWallet(wallet);
    this.eventBus.publish(
      new WalletUnlockedEvent({
        userId,
        amount,
        lockedBalance: safe.lockedBalance,
        availableBalance: safe.availableBalance,
        reason,
      }),
    );
    return safe;
  }

  /** Settle a buy trade: reduce balance and release locked funds. */
  async settleBuy(userId: string, amount: number, reason?: string) {
    const wallet = await this.walletRepository.mutateBalances(userId, (current) => {
      const balance = Number(current.balance);
      const locked = Number(current.lockedBalance);
      if (locked < amount) {
        throw new BadRequestException('Insufficient locked balance to settle');
      }
      if (balance < amount) {
        throw new BadRequestException('Insufficient balance to settle');
      }
      return { balance: balance - amount, lockedBalance: locked - amount };
    });

    const safe = toSafeWallet(wallet);
    this.eventBus.publish(
      new WalletDebitedEvent({
        userId,
        amount,
        balance: safe.balance,
        reason: reason ?? 'buy_settlement',
      }),
    );
    return safe;
  }

  async adminCredit(userId: string, dto: WalletAmountDto) {
    await this.ensureUserExists(userId);
    return this.credit(userId, dto.amount, dto.reason ?? 'admin_credit');
  }

  async adminDebit(userId: string, dto: WalletAmountDto) {
    await this.ensureUserExists(userId);
    return this.debit(userId, dto.amount, dto.reason ?? 'admin_debit');
  }

  async seedSystemWallets() {
    const existing = await this.walletRepository.countSystemGenerated();
    if (existing > 0) {
      return { created: 0, skipped: existing, message: 'System wallets already seeded' };
    }

    const users = await this.userService.findSystemUsers();
    if (users.length === 0) {
      return { created: 0, skipped: 0, message: 'Seed users first' };
    }

    let created = 0;

    for (const user of users) {
      await this.walletRepository.create({
        userId: user.id,
        balance: INITIAL_WALLET_BALANCE,
        lockedBalance: 0,
        isSystemGenerated: true,
      });
      created += 1;
      this.eventBus.publish(
        new WalletCreditedEvent({
          userId: user.id,
          amount: INITIAL_WALLET_BALANCE,
          balance: INITIAL_WALLET_BALANCE,
        }),
      );
    }

    return {
      created,
      skipped: 0,
      initialBalance: INITIAL_WALLET_BALANCE,
    };
  }

  async deleteSystemWallets() {
    const deleted = await this.walletRepository.deleteSystemGenerated();
    return { deleted: deleted.count };
  }

  async createWalletForUser(userId: string, isSystemGenerated = false) {
    const existing = await this.walletRepository.findByUserId(userId);
    if (existing) {
      return { created: false, walletId: existing.id };
    }

    const wallet = await this.walletRepository.create({
      userId,
      balance: INITIAL_WALLET_BALANCE,
      lockedBalance: 0,
      isSystemGenerated,
    });

    this.eventBus.publish(
      new WalletCreditedEvent({
        userId,
        amount: INITIAL_WALLET_BALANCE,
        balance: INITIAL_WALLET_BALANCE,
      }),
    );

    return { created: true, walletId: wallet.id };
  }

  private async ensureUserExists(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
