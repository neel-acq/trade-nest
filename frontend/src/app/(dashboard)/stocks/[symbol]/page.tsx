'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StockChart } from '@/components/stocks/stock-chart';
import { OrderBookPanel } from '@/components/stocks/order-book-panel';
import { RecentTradesPanel } from '@/components/stocks/recent-trades-panel';
import { OrderModal } from '@/components/modals/order-modal';
import { Button } from '@/components/ui/button';
import { useStockRealtime } from '@/hooks/use-realtime';
import type { SafeStock, StockHistoryPoint } from '@/types';
import { fetchOrderBook, type OrderBookSnapshot } from '@/lib/matching';
import { fetchStockBySymbol, fetchStockHistory } from '@/lib/stocks';

export default function StockDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol?.toUpperCase() ?? '';
  const [stock, setStock] = useState<SafeStock | null>(null);
  const [history, setHistory] = useState<StockHistoryPoint[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL' | null>(null);
  const [tradesTick, setTradesTick] = useState(0);

  const refreshOrderBook = useCallback(async () => {
    if (!symbol) return;
    try {
      const bookData = await fetchOrderBook(symbol);
      setOrderBook(bookData);
    } catch {
      /* order book refresh is best-effort */
    }
  }, [symbol]);

  const refreshLiveData = useCallback(async () => {
    await refreshOrderBook();
    setTradesTick((value) => value + 1);
    try {
      const stockData = await fetchStockBySymbol(symbol);
      setStock(stockData);
    } catch {
      /* price refresh is best-effort */
    }
  }, [symbol, refreshOrderBook]);

  useStockRealtime(symbol, refreshLiveData);

  useEffect(() => {
    if (!symbol) return;

    async function load() {
      setLoading(true);
      try {
        const [stockData, historyData, bookData] = await Promise.all([
          fetchStockBySymbol(symbol),
          fetchStockHistory(symbol),
          fetchOrderBook(symbol),
        ]);
        setStock(stockData);
        setHistory(historyData.data);
        setOrderBook(bookData);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [symbol]);

  if (loading) {
    return <p className="text-muted-foreground">Loading {symbol}...</p>;
  }

  if (!stock) {
    return (
      <div className="space-y-4">
        <p>Stock not found.</p>
        <Link href="/stocks" className="text-sm text-primary hover:underline">
          Back to stocks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/stocks" className="text-sm text-muted-foreground hover:underline">
            ← Back to stocks
          </Link>
          <h1 className="text-2xl font-bold mt-2">{stock.symbol}</h1>
          <p className="text-muted-foreground">{stock.companyName}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">₹{stock.currentPrice.toLocaleString('en-IN')}</p>
          <p className={stock.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
            {stock.changePrice >= 0 ? '+' : ''}
            {stock.changePrice.toFixed(2)} ({stock.changePercentage.toFixed(2)}%)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Volume" value={stock.currentVolume.toLocaleString('en-IN')} />
        <Stat label="Prev Price" value={`₹${stock.previousPrice.toLocaleString('en-IN')}`} />
        <Stat label="Change Vol" value={stock.changeVolume.toLocaleString('en-IN')} />
        <Stat label="Vol %" value={`${stock.volumePercentage.toFixed(2)}%`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Price History (90 days)</h2>
        <StockChart data={history} />
      </div>

      <OrderBookPanel snapshot={orderBook} loading={loading} />

      <RecentTradesPanel symbol={symbol} refreshKey={tradesTick} />

      <div className="flex gap-3">
        <Button onClick={() => setOrderSide('BUY')}>Buy</Button>
        <Button variant="outline" onClick={() => setOrderSide('SELL')}>
          Sell
        </Button>
      </div>

      {orderSide && stock && (
        <OrderModal
          stock={stock}
          side={orderSide}
          onClose={() => setOrderSide(null)}
          onSuccess={refreshOrderBook}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium mt-1">{value}</p>
    </div>
  );
}
