'use client';

import { useEffect, useState } from 'react';
import type { SafeTrade } from '@/types';
import { fetchStockTrades } from '@/lib/trades';
import { formatPrice, priceClass } from '@/lib/format';
import { cn } from '@/lib/utils';

interface RecentTradesPanelProps {
  symbol: string;
  refreshKey?: number;
  compact?: boolean;
}

export function RecentTradesPanel({ symbol, refreshKey = 0, compact }: RecentTradesPanelProps) {
  const [trades, setTrades] = useState<SafeTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await fetchStockTrades(symbol, { limit: compact ? 12 : 10 });
        setTrades(result.data);
      } catch {
        setTrades([]);
      } finally {
        setLoading(false);
      }
    }

    if (symbol) load();
  }, [symbol, refreshKey, compact]);

  if (compact) {
    return (
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">Loading...</p>
        ) : trades.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">No trades yet</p>
        ) : (
          <table className="trading-table">
            <thead>
              <tr>
                <th>Time</th>
                <th className="text-right">Price</th>
                <th className="text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id}>
                  <td className="text-muted-foreground text-xs">
                    {new Date(trade.executedAt).toLocaleTimeString('en-IN')}
                  </td>
                  <td className={cn('text-right font-medium', priceClass)}>{formatPrice(trade.price)}</td>
                  <td className={cn('text-right', priceClass)}>{trade.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <h2 className="text-lg font-semibold">Recent Trades</h2>
      <div className="trading-panel overflow-x-auto">
        <table className="trading-table">
          <thead>
            <tr>
              <th>Time</th>
              <th className="text-right">Price</th>
              <th className="text-right">Qty</th>
              <th>Buyer</th>
              <th>Seller</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground py-6">
                  Loading...
                </td>
              </tr>
            ) : trades.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground py-6">
                  No trades yet
                </td>
              </tr>
            ) : (
              trades.map((trade) => (
                <tr key={trade.id}>
                  <td className="text-muted-foreground">
                    {new Date(trade.executedAt).toLocaleTimeString('en-IN')}
                  </td>
                  <td className={cn('text-right font-medium', priceClass)}>{formatPrice(trade.price)}</td>
                  <td className={cn('text-right', priceClass)}>{trade.quantity}</td>
                  <td>{trade.buyer.username}</td>
                  <td>{trade.seller.username}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
