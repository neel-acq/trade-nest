import { cn } from '@/lib/utils';
import { priceClass } from '@/lib/format';

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  tone?: number;
  className?: string;
}

export function KpiCard({ label, value, sub, tone, className }: KpiCardProps) {
  const color =
    tone !== undefined ? (tone >= 0 ? 'text-gain' : 'text-loss') : 'text-foreground';

  return (
    <div className={cn('trading-panel p-4', className)}>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('text-xl font-semibold mt-1.5', priceClass, color)}>{value}</p>
      {sub && (
        <p className={cn('text-xs mt-1', tone !== undefined ? color : 'text-muted-foreground')}>
          {sub}
        </p>
      )}
    </div>
  );
}
