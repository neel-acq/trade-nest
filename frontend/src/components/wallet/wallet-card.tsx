'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SafeWallet } from '@/types';
import { useUserRealtime } from '@/hooks/use-realtime';
import { REALTIME_EVENTS } from '@/lib/realtime-events';
import { fetchMyWallet, formatInr } from '@/lib/wallets';
import { ApiError } from '@/lib/api';

const WALLET_REFRESH_EVENTS = [REALTIME_EVENTS.WALLET_UPDATED];

export function WalletCard() {
  const [wallet, setWallet] = useState<SafeWallet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWallet = useCallback(() => {
    fetchMyWallet()
      .then(setWallet)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load wallet'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useUserRealtime(loadWallet, WALLET_REFRESH_EVENTS);

  if (loading) {
    return <div className="rounded-lg border p-6 text-sm text-muted-foreground">Loading wallet...</div>;
  }

  if (error || !wallet) {
    return <div className="rounded-lg border p-6 text-sm text-destructive">{error ?? 'No wallet'}</div>;
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">Wallet Balance</p>
      <p className="text-3xl font-bold mt-1">{formatInr(wallet.balance)}</p>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Available</p>
          <p className="font-medium text-green-600">{formatInr(wallet.availableBalance)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Locked</p>
          <p className="font-medium text-amber-600">{formatInr(wallet.lockedBalance)}</p>
        </div>
      </div>
    </div>
  );
}
