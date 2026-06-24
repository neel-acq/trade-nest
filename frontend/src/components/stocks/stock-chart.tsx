'use client';

import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import type { StockHistoryPoint } from '@/types';

interface StockChartProps {
  data: StockHistoryPoint[];
  height?: number;
  dark?: boolean;
}

export function StockChart({ data, height = 400, dark = false }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const textColor = dark ? '#94a3b8' : '#334155';
    const gridColor = dark ? '#1e293b' : '#e2e8f0';
    const borderColor = dark ? '#334155' : '#cbd5e1';

    const chart = createChart(containerRef.current, {
      height,
      layout: { background: { color: 'transparent' }, textColor },
      grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
      timeScale: { borderColor },
      rightPriceScale: { borderColor },
    });

    const series = chart.addCandlestickSeries({
      upColor: dark ? '#22c55e' : '#16a34a',
      downColor: dark ? '#ef4444' : '#dc2626',
      borderVisible: false,
      wickUpColor: dark ? '#22c55e' : '#16a34a',
      wickDownColor: dark ? '#ef4444' : '#dc2626',
    });

    chartRef.current = chart;
    seriesRef.current = series;

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
      seriesRef.current = null;
    };
  }, [height, dark]);

  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return;

    seriesRef.current.setData(
      data.map((point) => ({
        time: point.time as unknown as import('lightweight-charts').UTCTimestamp,
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
      })),
    );

    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return <div ref={containerRef} className="w-full" />;
}
