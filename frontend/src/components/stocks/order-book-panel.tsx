'use client';

import type { OrderBookSnapshot } from '@/lib/matching';

interface OrderBookPanelProps {
  snapshot: OrderBookSnapshot | null;
  loading?: boolean;
}

export function OrderBookPanel({ snapshot, loading }: OrderBookPanelProps) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading order book...</p>;
  }

  if (!snapshot) {
    return <p className="text-sm text-muted-foreground">Order book unavailable.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Order Book</h2>
        <p className="text-xs text-muted-foreground">
          {snapshot.summary.totalBidQuantity} bid / {snapshot.summary.totalAskQuantity} ask shares
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <SideTable title="Top 5 Buys" rows={snapshot.topBuys} side="buy" />
        <SideTable title="Top 5 Sells" rows={snapshot.topSells} side="sell" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <DepthTable title="Bid Depth" levels={snapshot.depth.bids} side="buy" />
        <DepthTable title="Ask Depth" levels={snapshot.depth.asks} side="sell" />
      </div>
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
  const color = side === 'buy' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="rounded-md border">
      <div className="border-b px-3 py-2 text-sm font-medium">{title}</div>
      {rows.length === 0 ? (
        <p className="px-3 py-4 text-sm text-muted-foreground">No open orders</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="px-3 py-2 font-normal">Price</th>
              <th className="px-3 py-2 font-normal">Qty</th>
              <th className="px-3 py-2 font-normal">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.orderId} className="border-t">
                <td className={`px-3 py-2 font-medium ${color}`}>
                  ₹{row.price.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-2">{row.quantity}</td>
                <td className="px-3 py-2">{row.remainingQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DepthTable({
  title,
  levels,
  side,
}: {
  title: string;
  levels: OrderBookSnapshot['depth']['bids'];
  side: 'buy' | 'sell';
}) {
  const color = side === 'buy' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="rounded-md border">
      <div className="border-b px-3 py-2 text-sm font-medium">{title}</div>
      {levels.length === 0 ? (
        <p className="px-3 py-4 text-sm text-muted-foreground">No depth</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="px-3 py-2 font-normal">Price</th>
              <th className="px-3 py-2 font-normal">Quantity</th>
              <th className="px-3 py-2 font-normal">Orders</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level) => (
              <tr key={level.price} className="border-t">
                <td className={`px-3 py-2 font-medium ${color}`}>
                  ₹{level.price.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-2">{level.quantity}</td>
                <td className="px-3 py-2">{level.orderCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
