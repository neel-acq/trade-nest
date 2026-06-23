'use client';

import { useEffect, useState } from 'react';
import { WalletCard } from '@/components/wallet/wallet-card';
import type { SafeWallet } from '@/types';
import { fetchMyWallet, formatInr } from '@/lib/wallets';
import { ApiError } from '@/lib/api';

export default function WalletPage() {
  const [wallet, setWallet] = useState<SafeWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyWallet()
      .then(setWallet)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load wallet'));
  }, []);

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-muted-foreground text-sm">Simulated trading balance (INR)</p>
      </div>

      <WalletCard />

      {wallet && (
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <Row label="Total Balance" value={formatInr(wallet.balance)} />
          <Row label="Locked (pending orders)" value={formatInr(wallet.lockedBalance)} />
          <Row label="Available to trade" value={formatInr(wallet.availableBalance)} highlight />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">
        Starting balance: ₹10,00,000. Lock/unlock operations run when orders are placed (Phase 7).
      </p>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? 'font-semibold text-green-600' : 'font-medium'}>{value}</span>
    </div>
  );
}
