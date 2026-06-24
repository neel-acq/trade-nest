'use client';

import type { OrderBookSnapshot } from '@/lib/matching';
import { formatPrice, priceClass } from '@/lib/format';
import { cn } from '@/lib/utils';

interface OrderBookPanelProps {
  snapshot: OrderBookSnapshot | null;
  loading?: boolean;
  compact?: boolean;
}

export function OrderBookPanel({ snapshot, loading, compact }: OrderBookPanelProps) {
  if (loading) {
    return <p className="px-3 py-4 text-sm text-muted-foreground">Loading order book...</p>;
  }

  if (!snapshot) {
    return <p className="px-3 py-4 text-sm text-muted-foreground">Order book unavailable.</p>;
  }

  const maxBidQty = Math.max(...snapshot.depth.bids.map((l) => l.quantity), 1);
  const maxAskQty = Math.max(...snapshot.depth.asks.map((l) => l.quantity), 1);

  if (compact) {
    return (
      <div className="divide-y divide-border/40">
        <div className="px-3 py-2 text-[10px] text-muted-foreground flex justify-between">
          <span>{snapshot.summary.totalBidQuantity} bid qty</span>
          <span>{snapshot.summary.totalAskQuantity} ask qty</span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border/40">
          <DepthList levels={snapshot.depth.bids} side="buy" maxQty={maxBidQty} />
          <DepthList levels={snapshot.depth.asks} side="sell" maxQty={maxAskQty} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Order Book</h2>
        <p className="text-xs text-muted-foreground">
          {snapshot.summary.totalBidQuantity} bid / {snapshot.summary.totalAskQuantity} ask
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <SideTable title="Top 5 Buys" rows={snapshot.topBuys} side="buy" />
        <SideTable title="Top 5 Sells" rows={snapshot.topSells} side="sell" />
      </div>
    </div>
  );
}

function DepthList({
  levels,
  side,
  maxQty,
}: {
  levels: OrderBookSnapshot['depth']['bids'];
  side: 'buy' | 'sell';
  maxQty: number;
}) {
  const color = side === 'buy' ? 'text-bid' : 'text-ask';
  const barColor = side === 'buy' ? 'bg-bid/20' : 'bg-ask/20';

  return (
    <div className="p-2 space-y-0.5">
      <p className={cn('text-[10px] uppercase tracking-wider font-semibold px-1 mb-1', color)}>
        {side === 'buy' ? 'Bids' : 'Asks'}
      </p>
      {levels.length === 0 ? (
        <p className="text-xs text-muted-foreground px-1 py-2">No orders</p>
      ) : (
        levels.slice(0, 8).map((level) => (
          <div key={level.price} className="relative flex items-center justify-between text-xs py-0.5 px-1">
            <div
              className={cn('absolute inset-y-0 rounded-sm', barColor, side === 'buy' ? 'right-0' : 'left-0')}
              style={{ width: `${(level.quantity / maxQty) * 100}%` }}
            />
            <span className={cn('relative z-10 font-medium', color, priceClass)}>
              {formatPrice(level.price)}
            </span>
            <span className={cn('relative z-10 text-muted-foreground', priceClass)}>{level.quantity}</span>
          </div>
        ))
      )}
    </div>
  );
}

function SideTable({
  title,
  rows,
  side,
}: {
  title: string;
  rows: OrderBookSnapshot['topBuys'];
  side: 'buy' | 'sell';
}) {
  const color = side === 'buy' ? 'text-bid' : 'text-ask';

  return (
    <div className="trading-panel overflow-hidden">
      <div className="border-b px-3 py-2 text-sm font-medium">{title}</div>
      {rows.length === 0 ? (
        <p className="px-3 py-4 text-sm text-muted-foreground">No open orders</p>
      ) : (
        <table className="trading-table">
          <thead>
            <tr>
              <th>Price</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Left</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.orderId}>
                <td className={cn('font-medium', color, priceClass)}>{formatPrice(row.price)}</td>
                <td className={cn('text-right', priceClass)}>{row.quantity}</td>
                <td className={cn('text-right text-muted-foreground', priceClass)}>
                  {row.remainingQuantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
