import { cn } from '@/lib/utils';

interface PanelProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
}

export function Panel({ title, action, children, className, dense }: PanelProps) {
  return (
    <section className={cn('trading-panel overflow-hidden', className)}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className={cn(dense ? 'p-0' : 'p-4')}>{children}</div>
    </section>
  );
}
