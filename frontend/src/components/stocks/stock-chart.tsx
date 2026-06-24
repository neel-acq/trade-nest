'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { StockHistoryPoint } from '@/types';

interface StockChartProps {
  data: StockHistoryPoint[];
  height?: number;
  dark?: boolean;
  interval?: '1d' | '1h';
}

export function StockChart({ data, height = 400, dark = false, interval = '1d' }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const textColor = dark ? '#94a3b8' : '#334155';
    const gridColor = dark ? '#1e293b' : '#e2e8f0';
    const borderColor = dark ? '#334155' : '#cbd5e1';

    const chart = createChart(containerRef.current, {
      height,
      layout: { background: { color: 'transparent' }, textColor },
      grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
      timeScale: {
        borderColor,
        timeVisible: interval === '1h',
        secondsVisible: false,
      },
      rightPriceScale: { borderColor },
      crosshair: { mode: 1 },
    });

    const candles = chart.addCandlestickSeries({
      upColor: dark ? '#22c55e' : '#16a34a',
      downColor: dark ? '#ef4444' : '#dc2626',
      borderVisible: false,
      wickUpColor: dark ? '#22c55e' : '#16a34a',
      wickDownColor: dark ? '#ef4444' : '#dc2626',
    });

    const volume = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volume.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candles;
    volumeRef.current = volume;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
    };
  }, [height, dark, interval]);

  useEffect(() => {
    if (!candleRef.current || !volumeRef.current || data.length === 0) return;

    candleRef.current.setData(
      data.map((point) => ({
        time: point.time as UTCTimestamp,
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
      })),
    );

    volumeRef.current.setData(
      data.map((point) => ({
        time: point.time as UTCTimestamp,
        value: point.volume ?? 0,
        color:
          point.close >= point.open
            ? 'rgba(34, 197, 94, 0.45)'
            : 'rgba(239, 68, 68, 0.45)',
      })),
    );

    chartRef.current?.timeScale().fitContent();
  }, [data]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        No chart data available
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" />;
}
