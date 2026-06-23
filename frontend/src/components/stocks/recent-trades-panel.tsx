'use client';

import { useEffect, useState } from 'react';
import type { SafeTrade } from '@/types';
import { fetchStockTrades } from '@/lib/trades';

interface RecentTradesPanelProps {
  symbol: string;
  refreshKey?: number;
}

export function RecentTradesPanel({ symbol, refreshKey = 0 }: RecentTradesPanelProps) {
  const [trades, setTrades] = useState<SafeTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await fetchStockTrades(symbol, { limit: 10 });
        setTrades(result.data);
      } catch {
        setTrades([]);
      } finally {
        setLoading(false);
      }
    }

    if (symbol) load();
  }, [symbol, refreshKey]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Recent Trades</h2>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-normal text-muted-foreground">Time</th>
              <th className="px-3 py-2 text-right font-normal text-muted-foreground">Price</th>
              <th className="px-3 py-2 text-right font-normal text-muted-foreground">Qty</th>
              <th className="px-3 py-2 text-left font-normal text-muted-foreground">Buyer</th>
              <th className="px-3 py-2 text-left font-normal text-muted-foreground">Seller</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : trades.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  No trades yet
                </td>
              </tr>
            ) : (
              trades.map((trade) => (
                <tr key={trade.id} className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">
                    {new Date(trade.executedAt).toLocaleTimeString('en-IN')}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    ₹{trade.price.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2 text-right">{trade.quantity}</td>
                  <td className="px-3 py-2">{trade.buyer.username}</td>
                  <td className="px-3 py-2">{trade.seller.username}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
