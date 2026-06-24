'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AllocationChart } from '@/components/dashboard/allocation-chart';
import { KpiCard } from '@/components/trading/kpi-card';
import { PageHeader } from '@/components/trading/page-header';
import { Panel } from '@/components/trading/panel';
import { SideBadge } from '@/components/trading/side-badge';
import { StatusBadge } from '@/components/trading/status-badge';
import { useUserRealtime } from '@/hooks/use-realtime';
import type { AdminDashboardOverview, TraderDashboardOverview } from '@/types';
import { fetchAdminDashboard, fetchMyDashboard } from '@/lib/dashboard';
import { formatPrice, priceClass } from '@/lib/format';
import { REALTIME_EVENTS } from '@/lib/realtime-events';
import { formatInr } from '@/lib/wallets';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { CandlestickChart } from 'lucide-react';

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
    return <p className="text-muted-foreground text-sm">Loading dashboard...</p>;
  }

  if (!dashboard) {
    return <p className="text-destructive text-sm">Failed to load dashboard.</p>;
  }

  const pnlPositive = dashboard.portfolio.totalPnL >= 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trading Dashboard"
        description="Portfolio performance, allocation, and recent market activity"
        action={
          <Link
            href="/stocks"
            className="inline-flex h-8 items-center rounded-md bg-gain px-3 text-xs font-semibold text-white hover:bg-gain/90"
          >
            <CandlestickChart className="h-4 w-4 mr-1.5" />
            Trade Now
          </Link>
        }
      />

      <div className="trading-panel p-5 bg-gradient-to-br from-card to-secondary/30">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Net Worth</p>
        <p className={cn('text-4xl font-bold mt-1', priceClass)}>{formatInr(dashboard.netWorth)}</p>
        <div className="flex flex-wrap gap-6 mt-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Total P&L</p>
            <p className={cn('font-semibold', priceClass, pnlPositive ? 'text-gain' : 'text-loss')}>
              {formatInr(dashboard.portfolio.totalPnL)} ({pnlPositive ? '+' : ''}
              {dashboard.portfolio.totalPnLPercent.toFixed(2)}%)
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Portfolio</p>
            <p className={cn('font-semibold', priceClass)}>
              {formatInr(dashboard.portfolio.totalCurrentValue)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Available Cash</p>
            <p className={cn('font-semibold text-gain', priceClass)}>
              {formatInr(dashboard.wallet.availableBalance)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Open Orders" value={String(dashboard.orders.open + dashboard.orders.partial)} />
        <KpiCard label="Filled Orders" value={String(dashboard.orders.filled)} />
        <KpiCard label="Total Trades" value={String(dashboard.trades.totalTrades)} />
        <KpiCard label="Turnover" value={formatInr(dashboard.trades.totalTurnover)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Portfolio Allocation">
          <AllocationChart allocation={dashboard.allocation} />
        </Panel>

        <Panel
          title="Top Holdings"
          action={
            <Link href="/portfolio" className="text-xs text-primary hover:underline">
              View all
            </Link>
          }
        >
          {dashboard.topHoldings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No holdings yet. Start trading in Markets.</p>
          ) : (
            <table className="trading-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Value</th>
                  <th className="text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.topHoldings.map((holding) => (
                  <tr key={holding.id}>
                    <td>
                      <Link
                        href={`/stocks/${holding.symbol}`}
                        className="font-semibold hover:text-primary"
                      >
                        {holding.symbol}
                      </Link>
                    </td>
                    <td className={cn('text-right', priceClass)}>{holding.quantity}</td>
                    <td className={cn('text-right', priceClass)}>{formatInr(holding.currentValue)}</td>
                    <td
                      className={cn(
                        'text-right font-medium',
                        priceClass,
                        holding.unrealizedPnL >= 0 ? 'text-gain' : 'text-loss',
                      )}
                    >
                      {formatInr(holding.unrealizedPnL)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ActivityPanel
          title="Recent Orders"
          href="/orders"
          empty="No orders yet."
          rows={dashboard.recentOrders.map((order) => ({
            id: order.id,
            primary: order.symbol,
            badge: <SideBadge side={order.type} />,
            value: order.price ? formatPrice(order.price) : 'Market',
            status: <StatusBadge status={order.status} />,
          }))}
        />
        <ActivityPanel
          title="Recent Trades"
          href="/trades"
          empty="No trades yet."
          rows={dashboard.recentTrades.map((trade) => ({
            id: trade.id,
            primary: trade.symbol,
            badge: (
              <span className="text-xs text-muted-foreground">{trade.quantity} qty</span>
            ),
            value: formatPrice(trade.price),
            status: <span className="text-xs text-muted-foreground">{trade.side}</span>,
          }))}
        />
      </div>

      {adminDashboard && (
        <Panel title="Platform Overview (Admin)">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard label="Users" value={String(adminDashboard.users.total)} />
            <KpiCard label="Traders" value={String(adminDashboard.users.traders)} />
            <KpiCard label="Admins" value={String(adminDashboard.users.admins)} />
            <KpiCard label="Orders" value={String(adminDashboard.platform.totalOrders)} />
            <KpiCard label="Trades" value={String(adminDashboard.platform.totalTrades)} />
          </div>
        </Panel>
      )}
    </div>
  );
}

function ActivityPanel({
  title,
  href,
  empty,
  rows,
}: {
  title: string;
  href: string;
  empty: string;
  rows: {
    id: string;
    primary: string;
    badge: React.ReactNode;
    value: string;
    status: React.ReactNode;
  }[];
}) {
  return (
    <Panel
      title={title}
      action={
        <Link href={href} className="text-xs text-primary hover:underline">
          View all
        </Link>
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <table className="trading-table">
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <p className="font-semibold">{row.primary}</p>
                  <div className="mt-0.5">{row.badge}</div>
                </td>
                <td className={cn('text-right', priceClass)}>{row.value}</td>
                <td className="text-right">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
