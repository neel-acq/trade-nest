import { cn } from '@/lib/utils';

const styles: Record<string, string> = {
  OPEN: 'bg-amber-500/15 text-amber-400',
  PARTIAL: 'bg-blue-500/15 text-blue-400',
  FILLED: 'bg-gain/15 text-gain',
  CANCELLED: 'bg-muted text-muted-foreground',
  REJECTED: 'bg-loss/15 text-loss',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        styles[status] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {status}
    </span>
  );
}
