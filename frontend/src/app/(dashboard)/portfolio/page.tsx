'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { PortfolioSummary, SafeHolding } from '@/types';
import { fetchHoldings, fetchPortfolioSummary } from '@/lib/portfolio';
import { formatInr } from '@/lib/wallets';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground text-sm">Holdings, invested amount, and P&L</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryCard label="Holdings" value={String(summary.holdingsCount)} />
          <SummaryCard label="Invested" value={formatInr(summary.totalInvested)} />
          <SummaryCard label="Current Value" value={formatInr(summary.totalCurrentValue)} />
          <SummaryCard
            label="Unrealized P&L"
            value={formatInr(summary.totalUnrealizedPnL)}
            tone={summary.totalUnrealizedPnL}
          />
          <SummaryCard
            label="Realized P&L"
            value={formatInr(summary.totalRealizedPnL)}
            tone={summary.totalRealizedPnL}
          />
          <SummaryCard label="Total P&L" value={formatInr(summary.totalPnL)} tone={summary.totalPnL} />
        </div>
      )}

      <input
        className="h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm"
        placeholder="Search by symbol..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Symbol</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Avg Buy</th>
              <th className="px-4 py-3 text-right">LTP</th>
              <th className="px-4 py-3 text-right">Invested</th>
              <th className="px-4 py-3 text-right">Current</th>
              <th className="px-4 py-3 text-right">Unrealized</th>
              <th className="px-4 py-3 text-right">Realized</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : holdings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No holdings yet.{' '}
                  <Link href="/stocks" className="text-primary hover:underline">
                    Buy stocks
                  </Link>{' '}
                  to build your portfolio.
                </td>
              </tr>
            ) : (
              holdings.map((holding) => (
                <tr key={holding.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/stocks/${holding.symbol}`}
                      className="font-medium hover:underline"
                    >
                      {holding.symbol}
                    </Link>
                    <p className="text-xs text-muted-foreground">{holding.companyName}</p>
                  </td>
                  <td className="px-4 py-3 text-right">{holding.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    {formatInr(holding.averageBuyPrice)}
                  </td>
                  <td className="px-4 py-3 text-right">{formatInr(holding.currentPrice)}</td>
                  <td className="px-4 py-3 text-right">{formatInr(holding.investedAmount)}</td>
                  <td className="px-4 py-3 text-right">{formatInr(holding.currentValue)}</td>
                  <td className={`px-4 py-3 text-right ${pnlClass(holding.unrealizedPnL)}`}>
                    {formatInr(holding.unrealizedPnL)}
                    <span className="block text-xs">
                      {holding.unrealizedPnLPercent >= 0 ? '+' : ''}
                      {holding.unrealizedPnLPercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right ${pnlClass(holding.realizedPnL)}`}>
                    {formatInr(holding.realizedPnL)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: number;
}) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-semibold mt-1 ${tone !== undefined ? pnlClass(tone) : ''}`}>{value}</p>
    </div>
  );
}

function pnlClass(value: number) {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return '';
}
