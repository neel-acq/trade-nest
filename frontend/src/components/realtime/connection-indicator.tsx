'use client';

import { useRealtimeStatus } from '@/components/realtime/realtime-provider';

export function ConnectionIndicator() {
  const { connected } = useRealtimeStatus();

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={`h-2 w-2 rounded-full ${connected ? 'bg-gain' : 'bg-amber-400'}`}
        aria-hidden
      />
      <span className="hidden sm:inline">{connected ? 'Live feed' : 'Connecting...'}</span>
    </div>
  );
}
