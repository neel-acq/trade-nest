'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/trading/page-header';
import { Panel } from '@/components/trading/panel';
import { useMarketsRealtime } from '@/hooks/use-realtime';
import type { SafeStock } from '@/types';
import { fetchStocks } from '@/lib/stocks';
import { formatPercent, formatPrice, formatQty, priceClass } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function StocksPage() {
  const [stocks, setStocks] = useState<SafeStock[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const limit = 15;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchStocks({
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
      });
      setStocks(result.data);
      setTotal(result.meta.total);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  useMarketsRealtime(
    stocks.map((s) => s.symbol),
    (update) => {
      setStocks((prev) =>
        prev.map((stock) =>
          stock.symbol === update.symbol
            ? {
                ...stock,
                currentPrice: update.currentPrice,
                changePrice:
                  update.changePrice ??
                  Number((update.currentPrice - stock.previousPrice).toFixed(2)),
                changePercentage:
                  update.changePercentage ??
                  (stock.previousPrice === 0
                    ? 0
                    : Number(
                        (
                          ((update.currentPrice - stock.previousPrice) / stock.previousPrice) *
                          100
                        ).toFixed(4),
                      )),
              }
            : stock,
        ),
      );
    },
  );

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Markets"
        description="NSE equities — live prices, search, and trade"
      />

      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-xs h-9 bg-background"
          placeholder="Search symbol or company..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="symbol">Symbol</option>
          <option value="companyName">Company</option>
          <option value="currentPrice">Price</option>
          <option value="changePercentage">Change %</option>
          <option value="currentVolume">Volume</option>
        </select>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
      </div>

      <Panel dense>
        <div className="overflow-x-auto">
          <table className="trading-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Company</th>
                <th className="text-right">LTP</th>
                <th className="text-right">Change</th>
                <th className="text-right">Volume</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-8">
                    Loading markets...
                  </td>
                </tr>
              ) : (
                stocks.map((stock) => (
                  <tr key={stock.id}>
                    <td>
                      <Link
                        href={`/stocks/${stock.symbol}`}
                        className="font-semibold hover:text-primary"
                      >
                        {stock.symbol}
                      </Link>
                    </td>
                    <td className="text-muted-foreground max-w-[200px] truncate">{stock.companyName}</td>
                    <td className={cn('text-right font-medium', priceClass)}>
                      {formatPrice(stock.currentPrice)}
                    </td>
                    <td
                      className={cn(
                        'text-right font-medium',
                        priceClass,
                        stock.changePercentage >= 0 ? 'text-gain' : 'text-loss',
                      )}
                    >
                      {formatPercent(stock.changePercentage)}
                    </td>
                    <td className={cn('text-right text-muted-foreground', priceClass)}>
                      {formatQty(stock.currentVolume)}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/stocks/${stock.symbol}`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Trade →
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
        <p className="text-xs text-muted-foreground">
          Page {page} of {totalPages} · {total} stocks
        </p>
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
