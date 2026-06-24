'use client';

import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] border-t border-loss/30 bg-loss/10 backdrop-blur-md px-4 py-3">
      <div className="mx-auto flex max-w-4xl flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2 text-sm text-loss">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>No internet connection. Some features may not work.</span>
        </div>
        <Link href="/offline" className="text-xs font-medium text-primary hover:underline shrink-0">
          Learn more
        </Link>
      </div>
    </div>
  );
}
