'use client';

import { ErrorPage } from '@/components/errors/error-page';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OfflinePage() {
  const isOnline = useOnlineStatus();
  const router = useRouter();

  useEffect(() => {
    if (isOnline) {
      router.replace('/');
    }
  }, [isOnline, router]);

  return (
    <ErrorPage
      variant="offline"
      reset={() => window.location.reload()}
      showHome
      showLogin={false}
    />
  );
}
