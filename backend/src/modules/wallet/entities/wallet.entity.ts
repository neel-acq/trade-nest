import { Wallet } from '@prisma/client';

export interface SafeWallet {
  id: string;
  userId: string;
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  isSystemGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeWalletWithUser extends SafeWallet {
  user: {
    username: string;
    fullName: string;
    email: string;
  };
}

export function toSafeWallet(wallet: Wallet): SafeWallet {
  const balance = Number(wallet.balance);
  const lockedBalance = Number(wallet.lockedBalance);
  return {
    id: wallet.id,
    userId: wallet.userId,
    balance,
    lockedBalance,
    availableBalance: Number((balance - lockedBalance).toFixed(2)),
    isSystemGenerated: wallet.isSystemGenerated,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
}
