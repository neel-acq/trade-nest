'use client';

import { useEffect, useState } from 'react';
import { WalletCard } from '@/components/wallet/wallet-card';
import { KpiCard } from '@/components/trading/kpi-card';
import { PageHeader } from '@/components/trading/page-header';
import { Panel } from '@/components/trading/panel';
import type { SafeWallet } from '@/types';
import { fetchMyWallet, formatInr } from '@/lib/wallets';
import { priceClass } from '@/lib/format';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function WalletPage() {
  const [wallet, setWallet] = useState<SafeWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyWallet()
      .then(setWallet)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load wallet'));
  }, []);

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader
        title="Wallet"
        description="Simulated INR balance for order placement and settlement"
      />

      <div className="grid md:grid-cols-3 gap-3">
        {wallet && (
          <>
            <KpiCard label="Total Balance" value={formatInr(wallet.balance)} />
            <KpiCard label="Locked (Orders)" value={formatInr(wallet.lockedBalance)} />
            <KpiCard label="Available to Trade" value={formatInr(wallet.availableBalance)} tone={1} />
          </>
        )}
      </div>

      <WalletCard />

      {wallet && (
        <Panel title="Balance Breakdown">
          <div className="space-y-3 text-sm">
            <Row label="Total Balance" value={formatInr(wallet.balance)} />
            <Row label="Locked (pending orders)" value={formatInr(wallet.lockedBalance)} />
            <Row label="Available to trade" value={formatInr(wallet.availableBalance)} highlight />
          </div>
        </Panel>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">
        Starting balance ₹10,00,000. Funds lock when buy orders are placed and release on cancel or trade
        settlement.
      </p>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-semibold', priceClass, highlight ? 'text-gain' : '')}>{value}</span>
    </div>
  );
}
