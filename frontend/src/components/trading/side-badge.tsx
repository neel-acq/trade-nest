import { cn } from '@/lib/utils';

export function SideBadge({ side }: { side: string }) {
  const isBuy = side.includes('BUY');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        isBuy ? 'bg-gain/15 text-gain' : 'bg-loss/15 text-loss',
      )}
    >
      {side.replace('_', ' ')}
    </span>
  );
}
