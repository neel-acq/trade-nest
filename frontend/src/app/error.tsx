'use client';

import { useEffect } from 'react';
import { ErrorPage } from '@/components/errors/error-page';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorPage variant="server" message={error.message || undefined} reset={reset} />;
}
