'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StockChart } from '@/components/stocks/stock-chart';
import { OrderBookPanel } from '@/components/stocks/order-book-panel';
import { RecentTradesPanel } from '@/components/stocks/recent-trades-panel';
import { OrderTicket } from '@/components/trading/order-ticket';
import { Panel } from '@/components/trading/panel';
import { Button } from '@/components/ui/button';
import { useStockRealtime } from '@/hooks/use-realtime';
import type { SafeStock, StockHistoryPoint } from '@/types';
import { fetchOrderBook, type OrderBookSnapshot } from '@/lib/matching';
import { fetchStockBySymbol, fetchStockHistory } from '@/lib/stocks';
import { formatPercent, formatPrice, formatQty, priceClass } from '@/lib/format';
import { cn } from '@/lib/utils';

type ChartInterval = '1d' | '1h';

const RANGE_OPTIONS: { label: string; limit: number; intervals: ChartInterval[] }[] = [
  { label: '7D', limit: 7, intervals: ['1d', '1h'] },
  { label: '30D', limit: 30, intervals: ['1d', '1h'] },
  { label: '90D', limit: 90, intervals: ['1d'] },
  { label: '180D', limit: 180, intervals: ['1d'] },
  { label: '1Y', limit: 365, intervals: ['1d'] },
];

export default function StockDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol?.toUpperCase() ?? '';
  const [stock, setStock] = useState<SafeStock | null>(null);
  const [history, setHistory] = useState<StockHistoryPoint[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [tradesTick, setTradesTick] = useState(0);
  const [chartInterval, setChartInterval] = useState<ChartInterval>('1d');
  const [chartLimit, setChartLimit] = useState(90);

  const refreshOrderBook = useCallback(async () => {
    if (!symbol) return;
    try {
      const bookData = await fetchOrderBook(symbol);
      setOrderBook(bookData);
    } catch {
      /* best-effort */
    }
  }, [symbol]);

  const refreshHistory = useCallback(async () => {
    if (!symbol) return;
    try {
      const historyData = await fetchStockHistory(symbol, {
        interval: chartInterval,
        limit: chartLimit,
      });
      setHistory(historyData.data);
    } catch {
      /* best-effort */
    }
  }, [symbol, chartInterval, chartLimit]);

  const applyPriceUpdate = useCallback((currentPrice: number, changePrice?: number, changePercentage?: number) => {
    setStock((prev) => {
      if (!prev) return prev;
      const nextChangePrice =
        changePrice ?? Number((currentPrice - prev.previousPrice).toFixed(2));
      const nextChangePercentage =
        changePercentage ??
        (prev.previousPrice === 0
          ? 0
          : Number(((nextChangePrice / prev.previousPrice) * 100).toFixed(4)));
      return {
        ...prev,
        currentPrice,
        changePrice: nextChangePrice,
        changePercentage: nextChangePercentage,
      };
    });
  }, []);

  useStockRealtime(symbol, (event) => {
    if (event.type === 'price') {
      applyPriceUpdate(
        event.data.currentPrice,
        event.data.changePrice,
        event.data.changePercentage,
      );
      void refreshHistory();
      setTradesTick((value) => value + 1);
    }
    if (event.type === 'trade') {
      void refreshHistory();
      setTradesTick((value) => value + 1);
    }
    if (event.type === 'orderbook' || event.type === 'trade') {
      void refreshOrderBook();
    }
  });

  useEffect(() => {
    if (!symbol) return;

    async function load() {
      setLoading(true);
      try {
        const [stockData, historyData, bookData] = await Promise.all([
          fetchStockBySymbol(symbol),
          fetchStockHistory(symbol, { interval: chartInterval, limit: chartLimit }),
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
  }, [symbol, chartInterval, chartLimit]);

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
  const chartTitle =
    chartInterval === '1h' ? `Chart · ${chartLimit}D hourly` : `Chart · ${chartLimit}D`;

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
          <p className={cn('text-2xl sm:text-3xl font-bold', priceClass)}>
            {formatPrice(stock.currentPrice)}
          </p>
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
          <Panel
            title={chartTitle}
            dense
            action={
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex gap-1">
                  {(['1d', '1h'] as const).map((iv) => (
                    <Button
                      key={iv}
                      variant={chartInterval === iv ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setChartInterval(iv);
                        if (iv === '1h' && chartLimit > 30) setChartLimit(7);
                      }}
                    >
                      {iv === '1d' ? 'Daily' : 'Hourly'}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {RANGE_OPTIONS.filter((opt) => opt.intervals.includes(chartInterval)).map(
                    (opt) => (
                      <Button
                        key={opt.label}
                        variant={chartLimit === opt.limit ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setChartLimit(opt.limit)}
                      >
                        {opt.label}
                      </Button>
                    ),
                  )}
                </div>
              </div>
            }
          >
            <div className="p-2">
              <StockChart data={history} height={380} dark interval={chartInterval} />
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
          <OrderTicket
            stock={stock}
            onSuccess={() => {
              void refreshOrderBook();
              void refreshHistory();
              setTradesTick((value) => value + 1);
            }}
          />
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
