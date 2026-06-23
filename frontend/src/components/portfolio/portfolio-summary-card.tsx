'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PortfolioSummary } from '@/types';
import { fetchPortfolioSummary } from '@/lib/portfolio';
import { formatInr } from '@/lib/wallets';

export function PortfolioSummaryCard() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Loading portfolio...</p>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const pnlPositive = summary.totalPnL >= 0;

  return (
    <div className="rounded-lg border p-4 space-y-3 max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Portfolio</h2>
        <Link href="/portfolio" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Holdings" value={String(summary.holdingsCount)} />
        <Stat label="Invested" value={formatInr(summary.totalInvested)} />
        <Stat label="Current value" value={formatInr(summary.totalCurrentValue)} />
        <Stat
          label="Total P&L"
          value={formatInr(summary.totalPnL)}
          highlight={pnlPositive ? 'positive' : 'negative'}
        />
      </div>
      <p className={`text-xs ${pnlPositive ? 'text-green-600' : 'text-red-600'}`}>
        {pnlPositive ? '+' : ''}
        {summary.totalPnLPercent.toFixed(2)}% overall
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'positive' | 'negative';
}) {
  const color =
    highlight === 'positive'
      ? 'text-green-600'
      : highlight === 'negative'
        ? 'text-red-600'
        : undefined;

  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`font-medium ${color ?? ''}`}>{value}</p>
    </div>
  );
}
