'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/trading/kpi-card';
import { PageHeader } from '@/components/trading/page-header';
import { Panel } from '@/components/trading/panel';
import type { PortfolioSummary, SafeHolding } from '@/types';
import { fetchHoldings, fetchPortfolioSummary } from '@/lib/portfolio';
import { formatPrice, priceClass } from '@/lib/format';
import { formatInr } from '@/lib/wallets';
import { cn } from '@/lib/utils';

export default function PortfolioPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [holdings, setHoldings] = useState<SafeHolding[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, holdingsData] = await Promise.all([
        fetchPortfolioSummary(),
        fetchHoldings({
          page,
          limit,
          ...(search ? { search } : {}),
          sortBy: 'currentValue',
          sortOrder: 'desc',
        }),
      ]);
      setSummary(summaryData);
      setHoldings(holdingsData.data);
      setTotal(holdingsData.meta.total);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <PageHeader title="Portfolio" description="Positions, invested capital, and profit & loss" />

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Holdings" value={String(summary.holdingsCount)} />
          <KpiCard label="Invested" value={formatInr(summary.totalInvested)} />
          <KpiCard label="Current Value" value={formatInr(summary.totalCurrentValue)} />
          <KpiCard
            label="Unrealized P&L"
            value={formatInr(summary.totalUnrealizedPnL)}
            tone={summary.totalUnrealizedPnL}
          />
          <KpiCard
            label="Realized P&L"
            value={formatInr(summary.totalRealizedPnL)}
            tone={summary.totalRealizedPnL}
          />
          <KpiCard label="Total P&L" value={formatInr(summary.totalPnL)} tone={summary.totalPnL} />
        </div>
      )}

      <input
        className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm"
        placeholder="Search by symbol..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      <Panel dense>
        <div className="overflow-x-auto">
          <table className="trading-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Avg Buy</th>
                <th className="text-right">LTP</th>
                <th className="text-right">Invested</th>
                <th className="text-right">Current</th>
                <th className="text-right">Unrealized</th>
                <th className="text-right">Realized</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted-foreground py-8">
                    Loading positions...
                  </td>
                </tr>
              ) : holdings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted-foreground py-8">
                    No holdings yet.{' '}
                    <Link href="/stocks" className="text-primary hover:underline">
                      Start trading
                    </Link>
                  </td>
                </tr>
              ) : (
                holdings.map((holding) => (
                  <tr key={holding.id}>
                    <td>
                      <Link href={`/stocks/${holding.symbol}`} className="font-semibold hover:text-primary">
                        {holding.symbol}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {holding.companyName}
                      </p>
                    </td>
                    <td className={cn('text-right', priceClass)}>{holding.quantity}</td>
                    <td className={cn('text-right', priceClass)}>{formatPrice(holding.averageBuyPrice)}</td>
                    <td className={cn('text-right', priceClass)}>{formatPrice(holding.currentPrice)}</td>
                    <td className={cn('text-right', priceClass)}>{formatInr(holding.investedAmount)}</td>
                    <td className={cn('text-right', priceClass)}>{formatInr(holding.currentValue)}</td>
                    <td className={cn('text-right font-medium', priceClass, pnlClass(holding.unrealizedPnL))}>
                      {formatInr(holding.unrealizedPnL)}
                      <span className="block text-[10px]">
                        {holding.unrealizedPnLPercent >= 0 ? '+' : ''}
                        {holding.unrealizedPnLPercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className={cn('text-right', priceClass, pnlClass(holding.realizedPnL))}>
                      {formatInr(holding.realizedPnL)}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/stocks/${holding.symbol}`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Trade
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function pnlClass(value: number) {
  if (value > 0) return 'text-gain';
  if (value < 0) return 'text-loss';
  return '';
}
