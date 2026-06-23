'use client';

import { useRealtimeStatus } from '@/components/realtime/realtime-provider';

export function ConnectionIndicator() {
  const { connected } = useRealtimeStatus();

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-amber-500'}`}
        aria-hidden
      />
      <span>{connected ? 'Live' : 'Connecting...'}</span>
    </div>
  );
}
