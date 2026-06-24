'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Bell,
  Briefcase,
  CandlestickChart,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Settings,
  Shield,
  Upload,
  Users,
  Wallet,
} from 'lucide-react';
import { Avatar } from '@/components/avatar';
import { ConnectionIndicator } from '@/components/realtime/connection-indicator';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Button } from '@/components/ui/button';
import { logoutRequest } from '@/lib/auth';
import { formatInr, fetchMyWallet } from '@/lib/wallets';
import { priceClass } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

const traderNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stocks', label: 'Markets', icon: CandlestickChart },
  { href: '/orders', label: 'Orders', icon: ListOrdered },
  { href: '/trades', label: 'Trades', icon: ArrowLeftRight },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/notifications', label: 'Alerts', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const adminNav = [
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/wallets', label: 'Wallets', icon: Wallet },
  { href: '/admin/orders', label: 'Orders', icon: ListOrdered },
  { href: '/admin/stocks', label: 'Import Stocks', icon: Upload },
  { href: '/admin/logs', label: 'Logs', icon: Shield },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isAdminRoute = pathname.startsWith('/admin');
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);

  useEffect(() => {
    if (isAdminRoute) return;
    fetchMyWallet()
      .then((wallet) => setAvailableBalance(wallet.availableBalance))
      .catch(() => setAvailableBalance(null));
  }, [isAdminRoute, pathname]);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // ignore
    } finally {
      clearAuth();
      router.replace('/login');
    }
  };

  return (
    <div className="trading-theme min-h-screen flex bg-background text-foreground">
      <aside className="w-60 border-r border-border/80 bg-card/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-border/60">
          <Brand admin={isAdminRoute} />
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          {isAdminRoute ? (
            <>
              <p className="text-[10px] uppercase tracking-wider text-primary mb-1 px-3 font-semibold">
                Admin Console
              </p>
              {adminNav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground mt-4"
              >
                ← Back to trading
              </Link>
            </>
          ) : (
            <>
              {traderNav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
              {user?.role === 'ADMIN' && (
                <>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-5 mb-1 px-3">
                    Admin
                  </p>
                  {adminNav.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </>
              )}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border/60 text-xs text-muted-foreground">
          {isAdminRoute ? 'Platform administration' : 'Simulated trading · NSE equities'}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border/60 bg-card/40 px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {isAdminRoute ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                <Shield className="h-3.5 w-3.5" />
                Admin Console
              </span>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-gain animate-pulse" />
                  Market simulation active
                </div>
                {availableBalance !== null && (
                  <Link href="/wallet" className="wallet-chip hover:bg-accent/60 transition-colors">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Available</span>
                    <span className={cn('font-semibold text-gain', priceClass)}>
                      {formatInr(availableBalance)}
                    </span>
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isAdminRoute && <ConnectionIndicator />}
            <NotificationBell />
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border/60">
              {user && <Avatar fullName={user.fullName} className="h-8 w-8 text-xs" />}
              <div className="text-right">
                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{user?.role}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-5 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

function Brand({ admin }: { admin?: boolean }) {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight">
        Trade<span className="text-primary">Nest</span>
      </h2>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        {admin ? 'Administration panel' : 'Professional trading terminal'}
      </p>
    </div>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
  pathname: string;
}) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-primary/15 text-primary font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}
