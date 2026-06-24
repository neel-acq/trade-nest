'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StockChart } from '@/components/stocks/stock-chart';
import { OrderBookPanel } from '@/components/stocks/order-book-panel';
import { RecentTradesPanel } from '@/components/stocks/recent-trades-panel';
import { OrderTicket } from '@/components/trading/order-ticket';
import { Panel } from '@/components/trading/panel';
import { useStockRealtime } from '@/hooks/use-realtime';
import type { SafeStock, StockHistoryPoint } from '@/types';
import { fetchOrderBook, type OrderBookSnapshot } from '@/lib/matching';
import { fetchStockBySymbol, fetchStockHistory } from '@/lib/stocks';
import { formatPercent, formatPrice, formatQty, priceClass } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function StockDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol?.toUpperCase() ?? '';
  const [stock, setStock] = useState<SafeStock | null>(null);
  const [history, setHistory] = useState<StockHistoryPoint[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [tradesTick, setTradesTick] = useState(0);

  const refreshOrderBook = useCallback(async () => {
    if (!symbol) return;
    try {
      const bookData = await fetchOrderBook(symbol);
      setOrderBook(bookData);
    } catch {
      /* best-effort */
    }
  }, [symbol]);

  const refreshLiveData = useCallback(async () => {
    await refreshOrderBook();
    setTradesTick((value) => value + 1);
    try {
      const stockData = await fetchStockBySymbol(symbol);
      setStock(stockData);
    } catch {
      /* best-effort */
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
    return <p className="text-muted-foreground text-sm">Loading {symbol}...</p>;
  }

  if (!stock) {
    return (
      <div className="space-y-4">
        <p>Stock not found.</p>
        <Link href="/stocks" className="text-sm text-primary hover:underline">
          Back to markets
        </Link>
      </div>
    );
  }

  const positive = stock.changePercentage >= 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/stocks" className="text-xs text-muted-foreground hover:text-primary">
            ← Markets
          </Link>
          <div className="flex items-baseline gap-3 mt-1">
            <h1 className="text-2xl font-bold tracking-tight">{stock.symbol}</h1>
            <span className="text-sm text-muted-foreground">{stock.companyName}</span>
          </div>
        </div>
        <div className="text-right">
          <p className={cn('text-3xl font-bold', priceClass)}>{formatPrice(stock.currentPrice)}</p>
          <p className={cn('text-sm font-medium', positive ? 'text-gain' : 'text-loss')}>
            {positive ? '+' : ''}
            {stock.changePrice.toFixed(2)} ({formatPercent(stock.changePercentage)})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Volume" value={formatQty(stock.currentVolume)} />
        <Stat label="Prev Close" value={formatPrice(stock.previousPrice)} />
        <Stat label="Change Vol" value={formatQty(stock.changeVolume)} />
        <Stat label="Vol Change" value={formatPercent(stock.volumePercentage)} />
      </div>

      <div className="grid xl:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4 min-w-0">
          <Panel title="Chart · 90D" dense>
            <div className="p-2">
              <StockChart data={history} height={380} dark />
            </div>
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title="Order Book" dense>
              <OrderBookPanel snapshot={orderBook} loading={false} compact />
            </Panel>
            <Panel title="Recent Trades" dense>
              <RecentTradesPanel symbol={symbol} refreshKey={tradesTick} compact />
            </Panel>
          </div>
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <OrderTicket stock={stock} onSuccess={refreshLiveData} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="trading-panel px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-semibold mt-0.5', priceClass)}>{value}</p>
    </div>
  );
}
