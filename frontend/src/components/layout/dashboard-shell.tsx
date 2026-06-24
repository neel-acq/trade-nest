'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar } from '@/components/avatar';
import { ConnectionIndicator } from '@/components/realtime/connection-indicator';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Button } from '@/components/ui/button';
import { logoutRequest } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/stocks', label: 'Stocks' },
  { href: '/orders', label: 'Orders' },
  { href: '/trades', label: 'Trades' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/settings', label: 'Settings' },
];

const adminItems = [
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/wallets', label: 'Wallets' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/stocks', label: 'Import Stocks' },
  { href: '/admin/logs', label: 'Logs' },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

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
    <div className="min-h-screen flex">
      <aside className="w-56 border-r bg-card p-4 flex flex-col gap-6">
        <div>
          <h2 className="font-bold text-lg">TradeNest</h2>
          <p className="text-xs text-muted-foreground">Simulated trading</p>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm hover:bg-accent',
                pathname === item.href && 'bg-accent font-medium',
              )}
            >
              {item.label}
            </Link>
          ))}
          {user?.role === 'ADMIN' && (
            <>
              <p className="text-xs text-muted-foreground mt-4 mb-1 px-3">Admin</p>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm hover:bg-accent',
                    pathname === item.href && 'bg-accent font-medium',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user && <Avatar fullName={user.fullName} />}
            <div>
              <p className="font-medium text-sm">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionIndicator />
            <NotificationBell />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
