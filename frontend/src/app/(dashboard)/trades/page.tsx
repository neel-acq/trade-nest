'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { SafeTrade } from '@/types';
import { fetchTrades } from '@/lib/trades';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Trades</h1>
        <p className="text-muted-foreground text-sm">Executed buy and sell transactions</p>
      </div>

      <input
        className="h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm"
        placeholder="Search by symbol or trade ID..."
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
              <th className="px-4 py-3 text-left">Trade ID</th>
              <th className="px-4 py-3 text-left">Symbol</th>
              <th className="px-4 py-3 text-left">Side</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Value</th>
              <th className="px-4 py-3 text-left">Executed</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : trades.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No trades yet. Place matching orders to generate trades.
                </td>
              </tr>
            ) : (
              trades.map((trade) => (
                <tr key={trade.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{trade.tradeId}</td>
                  <td className="px-4 py-3 font-medium">{trade.symbol}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        trade.side === 'BUY'
                          ? 'text-green-600 font-medium'
                          : 'text-red-600 font-medium'
                      }
                    >
                      {trade.side ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{trade.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    ₹{trade.price.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    ₹{trade.totalValue.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(trade.executedAt).toLocaleString('en-IN')}
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
