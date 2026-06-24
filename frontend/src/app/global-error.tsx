'use client';

import { useEffect } from 'react';
import { ErrorPage } from '@/components/errors/error-page';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <ErrorPage
          variant="server"
          message={error.message || undefined}
          reset={reset}
          tradingTheme={false}
        />
      </body>
    </html>
  );
}
