'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/trading/page-header';
import { Panel } from '@/components/trading/panel';
import { SideBadge } from '@/components/trading/side-badge';
import type { SafeTrade } from '@/types';
import { fetchTrades } from '@/lib/trades';
import { formatPrice, priceClass } from '@/lib/format';
import { formatInr } from '@/lib/wallets';
import { cn } from '@/lib/utils';

export default function TradesPage() {
  const [trades, setTrades] = useState<SafeTrade[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchTrades({
        page,
        limit,
        ...(search ? { search } : {}),
        sortBy: 'executedAt',
        sortOrder: 'desc',
      });
      setTrades(result.data);
      setTotal(result.meta.total);
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
      <PageHeader title="Trade History" description="Executed buy and sell transactions" />

      <input
        className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm"
        placeholder="Search by symbol or trade ID..."
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
                <th>Trade ID</th>
                <th>Symbol</th>
                <th>Side</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Value</th>
                <th>Executed</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-8">
                    Loading trades...
                  </td>
                </tr>
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-8">
                    No trades yet.{' '}
                    <Link href="/stocks" className="text-primary hover:underline">
                      Place matching orders
                    </Link>
                  </td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade.id}>
                    <td className="font-mono text-xs text-muted-foreground">{trade.tradeId}</td>
                    <td>
                      <Link href={`/stocks/${trade.symbol}`} className="font-semibold hover:text-primary">
                        {trade.symbol}
                      </Link>
                    </td>
                    <td>
                      {trade.side ? <SideBadge side={`${trade.side}`} /> : '—'}
                    </td>
                    <td className={cn('text-right', priceClass)}>{trade.quantity}</td>
                    <td className={cn('text-right', priceClass)}>{formatPrice(trade.price)}</td>
                    <td className={cn('text-right font-medium', priceClass)}>{formatInr(trade.totalValue)}</td>
                    <td className="text-xs text-muted-foreground">
                      {new Date(trade.executedAt).toLocaleString('en-IN')}
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
