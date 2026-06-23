'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { SafeOrder } from '@/types';
import { cancelOrder, fetchOrders } from '@/lib/orders';
import { ApiError } from '@/lib/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState<SafeOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchOrders({
        page,
        limit,
        ...(status ? { status } : {}),
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
    if (!confirm('Cancel this order?')) return;
    try {
      await cancelOrder(orderId);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Cancel failed');
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground text-sm">LIMIT / MARKET buy & sell orders</p>
      </div>

      <select
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Symbol</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{order.symbol}</td>
                  <td className="px-4 py-3">{order.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-right">{order.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    {order.price ? `₹${order.price.toLocaleString('en-IN')}` : 'Market'}
                  </td>
                  <td className="px-4 py-3">{order.status}</td>
                  <td className="px-4 py-3">
                    {(order.status === 'OPEN' || order.status === 'PARTIAL') && (
                      <Button variant="outline" size="sm" onClick={() => handleCancel(order.id)}>
                        Cancel
                      </Button>
                    )}
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
