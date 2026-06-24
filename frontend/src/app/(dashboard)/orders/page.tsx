'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/trading/page-header';
import { Panel } from '@/components/trading/panel';
import { SideBadge } from '@/components/trading/side-badge';
import { StatusBadge } from '@/components/trading/status-badge';
import type { SafeOrder } from '@/types';
import { cancelOrder, fetchOrders } from '@/lib/orders';
import { formatPrice, priceClass } from '@/lib/format';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState<SafeOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchOrders({
        page,
        limit,
        ...(status ? { status } : {}),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setOrders(result.data);
      setTotal(result.meta.total);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (orderId: string) => {
    setCancelId(orderId);
    try {
      await cancelOrder(orderId);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Cancel failed');
    } finally {
      setCancelId(null);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <PageHeader title="Order Blotter" description="Open, partial, and filled orders" />

      <select
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setPage(1);
        }}
      >
        <option value="">All statuses</option>
        <option value="OPEN">Open</option>
        <option value="PARTIAL">Partial</option>
        <option value="FILLED">Filled</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      <Panel dense>
        <div className="overflow-x-auto">
          <table className="trading-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Side</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Filled</th>
                <th className="text-right">Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-8">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-8">
                    No orders yet.{' '}
                    <Link href="/stocks" className="text-primary hover:underline">
                      Place your first trade
                    </Link>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/stocks/${order.symbol}`} className="font-semibold hover:text-primary">
                        {order.symbol}
                      </Link>
                    </td>
                    <td>
                      <SideBadge side={order.type} />
                    </td>
                    <td className={cn('text-right', priceClass)}>{order.quantity}</td>
                    <td className={cn('text-right', priceClass)}>{order.filledQuantity}</td>
                    <td className={cn('text-right', priceClass)}>
                      {order.price ? formatPrice(order.price) : 'Market'}
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>
                      {(order.status === 'OPEN' || order.status === 'PARTIAL') && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cancelId === order.id}
                          onClick={() => handleCancel(order.id)}
                        >
                          {cancelId === order.id ? '...' : 'Cancel'}
                        </Button>
                      )}
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
