'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AllocationChart } from '@/components/dashboard/allocation-chart';
import { useUserRealtime } from '@/hooks/use-realtime';
import type { AdminDashboardOverview, TraderDashboardOverview } from '@/types';
import { fetchAdminDashboard, fetchMyDashboard } from '@/lib/dashboard';
import { REALTIME_EVENTS } from '@/lib/realtime-events';
import { formatInr } from '@/lib/wallets';
import { useAuthStore } from '@/stores/auth-store';

const DASHBOARD_REFRESH_EVENTS = [
  REALTIME_EVENTS.WALLET_UPDATED,
  REALTIME_EVENTS.ORDER_CREATED,
  REALTIME_EVENTS.ORDER_CANCELLED,
  REALTIME_EVENTS.TRADE_EXECUTED,
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [dashboard, setDashboard] = useState<TraderDashboardOverview | null>(null);
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyDashboard();
      setDashboard(data);

      if (user?.role === 'ADMIN') {
        const adminData = await fetchAdminDashboard();
        setAdminDashboard(adminData);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useUserRealtime(loadDashboard, DASHBOARD_REFRESH_EVENTS);

  if (loading) {
    return <p className="text-muted-foreground">Loading dashboard...</p>;
  }

  if (!dashboard) {
    return <p className="text-destructive">Failed to load dashboard.</p>;
  }

  const pnlPositive = dashboard.portfolio.totalPnL >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Net worth, portfolio allocation, and recent activity
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Net Worth" value={formatInr(dashboard.netWorth)} />
        <KpiCard label="Available Cash" value={formatInr(dashboard.wallet.availableBalance)} />
        <KpiCard label="Portfolio Value" value={formatInr(dashboard.portfolio.totalCurrentValue)} />
        <KpiCard
          label="Total P&L"
          value={formatInr(dashboard.portfolio.totalPnL)}
          sub={`${pnlPositive ? '+' : ''}${dashboard.portfolio.totalPnLPercent.toFixed(2)}%`}
          tone={dashboard.portfolio.totalPnL}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Open Orders" value={String(dashboard.orders.open + dashboard.orders.partial)} />
        <KpiCard label="Filled Orders" value={String(dashboard.orders.filled)} />
        <KpiCard label="Total Trades" value={String(dashboard.trades.totalTrades)} />
        <KpiCard label="Trade Turnover" value={formatInr(dashboard.trades.totalTurnover)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Portfolio Allocation</h2>
            <Link href="/portfolio" className="text-sm text-primary hover:underline">
              View portfolio
            </Link>
          </div>
          <AllocationChart allocation={dashboard.allocation} />
        </section>

        <section className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Top Holdings</h2>
            <Link href="/portfolio" className="text-sm text-primary hover:underline">
              See all
            </Link>
          </div>
          {dashboard.topHoldings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No holdings yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 font-normal">Symbol</th>
                  <th className="pb-2 font-normal text-right">Qty</th>
                  <th className="pb-2 font-normal text-right">Value</th>
                  <th className="pb-2 font-normal text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.topHoldings.map((holding) => (
                  <tr key={holding.id} className="border-t">
                    <td className="py-2">
                      <Link href={`/stocks/${holding.symbol}`} className="font-medium hover:underline">
                        {holding.symbol}
                      </Link>
                    </td>
                    <td className="py-2 text-right">{holding.quantity}</td>
                    <td className="py-2 text-right">{formatInr(holding.currentValue)}</td>
                    <td
                      className={`py-2 text-right ${holding.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatInr(holding.unrealizedPnL)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ActivityTable
          title="Recent Orders"
          href="/orders"
          empty="No orders yet."
          rows={dashboard.recentOrders.map((order) => ({
            id: order.id,
            primary: order.symbol,
            secondary: order.type.replace('_', ' '),
            value: order.price ? formatInr(order.price) : 'Market',
            status: order.status,
          }))}
        />
        <ActivityTable
          title="Recent Trades"
          href="/trades"
          empty="No trades yet."
          rows={dashboard.recentTrades.map((trade) => ({
            id: trade.id,
            primary: trade.symbol,
            secondary: trade.side ?? '—',
            value: formatInr(trade.price),
            status: `${trade.quantity} qty`,
          }))}
        />
      </div>

      {adminDashboard && (
        <section className="rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold">Platform Overview (Admin)</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard label="Users" value={String(adminDashboard.users.total)} />
            <KpiCard label="Traders" value={String(adminDashboard.users.traders)} />
            <KpiCard label="Admins" value={String(adminDashboard.users.admins)} />
            <KpiCard label="Platform Orders" value={String(adminDashboard.platform.totalOrders)} />
            <KpiCard label="Platform Trades" value={String(adminDashboard.platform.totalTrades)} />
          </div>
          <p className="text-sm text-muted-foreground">
            Platform turnover: {formatInr(adminDashboard.platform.totalTurnover)}
          </p>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/stocks"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Browse Stocks
        </Link>
        <Link
          href="/orders"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Orders
        </Link>
        <Link
          href="/wallet"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Wallet
        </Link>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: number;
}) {
  const color =
    tone !== undefined ? (tone >= 0 ? 'text-green-600' : 'text-red-600') : undefined;

  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color ?? ''}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${color ?? 'text-muted-foreground'}`}>{sub}</p>}
    </div>
  );
}

function ActivityTable({
  title,
  href,
  empty,
  rows,
}: {
  title: string;
  href: string;
  empty: string;
  rows: { id: string; primary: string; secondary: string; value: string; status: string }[];
}) {
  return (
    <section className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link href={href} className="text-sm text-primary hover:underline">
          View all
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t first:border-0">
                <td className="py-2">
                  <p className="font-medium">{row.primary}</p>
                  <p className="text-xs text-muted-foreground">{row.secondary}</p>
                </td>
                <td className="py-2 text-right">{row.value}</td>
                <td className="py-2 text-right text-muted-foreground">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
