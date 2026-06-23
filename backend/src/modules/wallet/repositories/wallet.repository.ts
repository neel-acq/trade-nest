import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Wallet } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface CreateWalletData {
  userId: string;
  balance: number;
  lockedBalance?: number;
  isSystemGenerated?: boolean;
}

export interface FindWalletsParams {
  page: number;
  limit: number;
  search?: string;
  minBalance?: number;
  maxBalance?: number;
  sortBy: 'balance' | 'lockedBalance' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  countSystemGenerated() {
    return this.prisma.wallet.count({
      where: { isSystemGenerated: true, deletedAt: null },
    });
  }

  create(data: CreateWalletData): Promise<Wallet> {
    return this.prisma.wallet.create({
      data: {
        userId: data.userId,
        balance: data.balance,
        lockedBalance: data.lockedBalance ?? 0,
        isSystemGenerated: data.isSystemGenerated ?? false,
      },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.wallet.findFirst({
      where: { userId, deletedAt: null },
    });
  }

  findById(id: string) {
    return this.prisma.wallet.findFirst({
      where: { id, deletedAt: null },
    });
  }

  createMany(wallets: CreateWalletData[]) {
    return this.prisma.wallet.createMany({
      data: wallets.map((wallet) => ({
        userId: wallet.userId,
        balance: wallet.balance,
        lockedBalance: wallet.lockedBalance ?? 0,
        isSystemGenerated: wallet.isSystemGenerated ?? true,
      })),
      skipDuplicates: true,
    });
  }

  deleteSystemGenerated() {
    return this.prisma.wallet.deleteMany({
      where: { isSystemGenerated: true },
    });
  }

  async updateBalances(
    walletId: string,
    data: { balance?: number; lockedBalance?: number; updatedBy?: string },
  ): Promise<Wallet> {
    return this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        ...(data.balance !== undefined ? { balance: data.balance } : {}),
        ...(data.lockedBalance !== undefined ? { lockedBalance: data.lockedBalance } : {}),
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
      },
    });
  }

  async findManyPaginated(params: FindWalletsParams) {
    const { page, limit, search, minBalance, maxBalance, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.WalletWhereInput = {
      deletedAt: null,
      ...(minBalance !== undefined || maxBalance !== undefined
        ? {
            balance: {
              ...(minBalance !== undefined ? { gte: minBalance } : {}),
              ...(maxBalance !== undefined ? { lte: maxBalance } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            user: {
              OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const orderBy: Prisma.WalletOrderByWithRelationInput =
      sortBy === 'createdAt' ? { createdAt: sortOrder } : { [sortBy]: sortOrder };

    const [total, wallets] = await this.prisma.$transaction([
      this.prisma.wallet.count({ where }),
      this.prisma.wallet.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: { username: true, fullName: true, email: true },
          },
        },
      }),
    ]);

    return { total, wallets };
  }

  async mutateBalances(
    userId: string,
    mutate: (wallet: Wallet) => { balance: number; lockedBalance: number },
  ): Promise<Wallet> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findFirst({
        where: { userId, deletedAt: null },
      });

      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      const next = mutate(wallet);
      if (next.balance < 0 || next.lockedBalance < 0) {
        throw new BadRequestException('Insufficient wallet balance');
      }
      if (next.lockedBalance > next.balance) {
        throw new BadRequestException('Locked balance cannot exceed total balance');
      }

      return tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: next.balance,
          lockedBalance: next.lockedBalance,
          updatedAt: new Date(),
        },
      });
    });
  }
}
