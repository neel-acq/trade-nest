'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { SafeStock } from '@/types';
import { fetchStocks } from '@/lib/stocks';

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

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stocks</h1>
        <p className="text-muted-foreground text-sm">Indian equities — search, filter, sort</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search symbol or company..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Symbol</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Change</th>
              <th className="px-4 py-3 text-right">Volume</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : (
              stocks.map((stock) => (
                <tr key={stock.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/stocks/${stock.symbol}`} className="font-medium text-primary hover:underline">
                      {stock.symbol}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{stock.companyName}</td>
                  <td className="px-4 py-3 text-right">₹{stock.currentPrice.toLocaleString('en-IN')}</td>
                  <td
                    className={`px-4 py-3 text-right ${stock.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {stock.changePercentage >= 0 ? '+' : ''}
                    {stock.changePercentage.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right">{stock.currentVolume.toLocaleString('en-IN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages} ({total} stocks)
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
