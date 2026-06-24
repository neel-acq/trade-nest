'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useCallback, useEffect, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import {
  cancelOrder,
  createAdminOrder,
  createLiquidityPair,
  createMarketDepth,
  fetchOrders,
  type OrderType,
} from '@/lib/orders';
import { fetchStocks } from '@/lib/stocks';
import { fetchUsers } from '@/lib/users';
import type { AuthUser, SafeOrder, SafeStock } from '@/types';

const orderColumns: ColumnDef<SafeOrder, unknown>[] = [
  { accessorKey: 'symbol', header: 'Symbol', id: 'symbol' },
  {
    id: 'user',
    header: 'User',
    cell: ({ row }) => row.original.user?.username ?? row.original.userId.slice(0, 8),
  },
  { accessorKey: 'type', header: 'Type', id: 'type' },
  { accessorKey: 'status', header: 'Status', id: 'status' },
  {
    id: 'quantity',
    header: 'Qty',
    cell: ({ row }) => `${row.original.filledQuantity}/${row.original.quantity}`,
  },
  {
    id: 'price',
    header: 'Price',
    cell: ({ row }) =>
      row.original.price ? `₹${row.original.price.toLocaleString('en-IN')}` : 'Market',
  },
  {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: ({ row, table }) => {
      const onCancel = (table.options.meta as { onCancel?: (id: string) => void })?.onCancel;
      const canCancel = row.original.status === 'OPEN' || row.original.status === 'PARTIAL';
      return canCancel ? (
        <Button variant="outline" size="sm" onClick={() => onCancel?.(row.original.id)}>
          Cancel
        </Button>
      ) : null;
    },
  },
];

const orderTypes: OrderType[] = ['LIMIT_BUY', 'LIMIT_SELL', 'MARKET_BUY', 'MARKET_SELL'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<SafeOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [stocks, setStocks] = useState<SafeStock[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const limit = 10;

  const [singleOrder, setSingleOrder] = useState({
    userId: '',
    stockId: '',
    type: 'LIMIT_BUY' as OrderType,
    quantity: 10,
    price: 0,
  });

  const [liquidity, setLiquidity] = useState({
    stockId: '',
    sellerUserId: '',
    buyerUserId: '',
    quantity: 10,
    price: 0,
    grantSellerShares: true,
  });

  const [depth, setDepth] = useState({
    stockId: '',
    sellerUserId: '',
    buyerUserId: '',
    quantity: 10,
    sellPrice: 0,
    buyPrice: 0,
    grantSellerShares: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchUsers({ limit: 100, role: 'TRADER', sortBy: 'username', sortOrder: 'asc' })
      .then((result) => setUsers(result.data))
      .catch(() => setUsers([]));
    fetchStocks({ limit: 100, sortBy: 'symbol', sortOrder: 'asc' })
      .then((result) => {
        setStocks(result.data);
        if (result.data[0]) {
          const price = result.data[0].currentPrice;
          setSingleOrder((prev) => ({ ...prev, stockId: prev.stockId || result.data[0].id, price }));
          setLiquidity((prev) => ({
            ...prev,
            stockId: prev.stockId || result.data[0].id,
            price,
          }));
          setDepth((prev) => ({
            ...prev,
            stockId: prev.stockId || result.data[0].id,
            sellPrice: price + 5,
            buyPrice: price - 5,
          }));
        }
      })
      .catch(() => setStocks([]));
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchOrders({
        page,
        limit,
        search: debouncedSearch || undefined,
        ...(status ? { status } : {}),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setOrders(result.data);
      setTotal(result.meta.total);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCancel = async (orderId: string) => {
    if (!confirm('Cancel this order?')) return;
    setError('');
    try {
      await cancelOrder(orderId);
      setMessage('Order cancelled');
      loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cancel failed');
    }
  };

  const handleCreateOrder = async () => {
    setError('');
    setMessage('');
    try {
      const isLimit = singleOrder.type.startsWith('LIMIT_');
      await createAdminOrder({
        userId: singleOrder.userId,
        stockId: singleOrder.stockId,
        type: singleOrder.type,
        quantity: singleOrder.quantity,
        ...(isLimit ? { price: singleOrder.price } : {}),
      });
      setMessage('Order placed successfully');
      loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to place order');
    }
  };

  const handleLiquidityPair = async () => {
    setError('');
    setMessage('');
    try {
      const result = await createLiquidityPair(liquidity);
      setMessage(result.message);
      loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create liquidity pair');
    }
  };

  const handleMarketDepth = async () => {
    setError('');
    setMessage('');
    try {
      const result = await createMarketDepth(depth);
      setMessage(result.message);
      loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add market depth');
    }
  };

  const onStockChange = (stockId: string, setter: 'single' | 'liquidity' | 'depth') => {
    const stock = stocks.find((item) => item.id === stockId);
    const price = stock?.currentPrice ?? 0;
    if (setter === 'single') {
      setSingleOrder((prev) => ({ ...prev, stockId, price }));
    } else if (setter === 'liquidity') {
      setLiquidity((prev) => ({ ...prev, stockId, price }));
    } else {
      setDepth((prev) => ({
        ...prev,
        stockId,
        sellPrice: price + 5,
        buyPrice: price - 5,
      }));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Orders</h1>
        <p className="text-muted-foreground text-sm">
          Manage platform orders and inject market liquidity so traders can buy and sell
        </p>
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border p-4 space-y-3">
          <h2 className="font-semibold">Place order for user</h2>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={singleOrder.userId}
            onChange={(e) => setSingleOrder((prev) => ({ ...prev, userId: e.target.value }))}
          >
            <option value="">Select trader</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={singleOrder.stockId}
            onChange={(e) => onStockChange(e.target.value, 'single')}
          >
            <option value="">Select stock</option>
            {stocks.map((stock) => (
              <option key={stock.id} value={stock.id}>
                {stock.symbol}
              </option>
            ))}
          </select>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={singleOrder.type}
            onChange={(e) =>
              setSingleOrder((prev) => ({ ...prev, type: e.target.value as OrderType }))
            }
          >
            {orderTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min={1}
            placeholder="Quantity"
            value={singleOrder.quantity}
            onChange={(e) =>
              setSingleOrder((prev) => ({ ...prev, quantity: Number(e.target.value) }))
            }
          />
          {singleOrder.type.startsWith('LIMIT_') && (
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="Price"
              value={singleOrder.price}
              onChange={(e) =>
                setSingleOrder((prev) => ({ ...prev, price: Number(e.target.value) }))
              }
            />
          )}
          <Button className="w-full" onClick={handleCreateOrder}>
            Place order
          </Button>
        </section>

        <section className="rounded-lg border p-4 space-y-3">
          <h2 className="font-semibold">Instant trade (liquidity pair)</h2>
          <p className="text-xs text-muted-foreground">
            Places a sell then a buy at the same price — they match immediately.
          </p>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={liquidity.stockId}
            onChange={(e) => onStockChange(e.target.value, 'liquidity')}
          >
            {stocks.map((stock) => (
              <option key={stock.id} value={stock.id}>
                {stock.symbol}
              </option>
            ))}
          </select>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={liquidity.sellerUserId}
            onChange={(e) => setLiquidity((prev) => ({ ...prev, sellerUserId: e.target.value }))}
          >
            <option value="">Seller</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={liquidity.buyerUserId}
            onChange={(e) => setLiquidity((prev) => ({ ...prev, buyerUserId: e.target.value }))}
          >
            <option value="">Buyer</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min={1}
            value={liquidity.quantity}
            onChange={(e) => setLiquidity((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
          />
          <Input
            type="number"
            min={0}
            step="0.01"
            value={liquidity.price}
            onChange={(e) => setLiquidity((prev) => ({ ...prev, price: Number(e.target.value) }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={liquidity.grantSellerShares}
              onChange={(e) =>
                setLiquidity((prev) => ({ ...prev, grantSellerShares: e.target.checked }))
              }
            />
            Grant seller shares if needed
          </label>
          <Button className="w-full" onClick={handleLiquidityPair}>
            Execute pair trade
          </Button>
        </section>

        <section className="rounded-lg border p-4 space-y-3">
          <h2 className="font-semibold">Add market depth</h2>
          <p className="text-xs text-muted-foreground">
            Resting buy below and sell above market — provides liquidity on the book.
          </p>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={depth.stockId}
            onChange={(e) => onStockChange(e.target.value, 'depth')}
          >
            {stocks.map((stock) => (
              <option key={stock.id} value={stock.id}>
                {stock.symbol}
              </option>
            ))}
          </select>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={depth.sellerUserId}
            onChange={(e) => setDepth((prev) => ({ ...prev, sellerUserId: e.target.value }))}
          >
            <option value="">Seller</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={depth.buyerUserId}
            onChange={(e) => setDepth((prev) => ({ ...prev, buyerUserId: e.target.value }))}
          >
            <option value="">Buyer</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min={1}
            value={depth.quantity}
            onChange={(e) => setDepth((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
          />
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="Sell price"
            value={depth.sellPrice}
            onChange={(e) => setDepth((prev) => ({ ...prev, sellPrice: Number(e.target.value) }))}
          />
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="Buy price"
            value={depth.buyPrice}
            onChange={(e) => setDepth((prev) => ({ ...prev, buyPrice: Number(e.target.value) }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={depth.grantSellerShares}
              onChange={(e) =>
                setDepth((prev) => ({ ...prev, grantSellerShares: e.target.checked }))
              }
            />
            Grant seller shares if needed
          </label>
          <Button className="w-full" variant="outline" onClick={handleMarketDepth}>
            Add depth to book
          </Button>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
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
      </div>

      <DataTable
        columns={orderColumns}
        data={orders}
        total={total}
        page={page}
        limit={limit}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onPageChange={setPage}
        isLoading={loading}
        searchPlaceholder="Search by symbol..."
        meta={{ onCancel: handleCancel }}
      />
    </div>
  );
}
