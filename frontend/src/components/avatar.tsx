import { getInitials } from '@/lib/avatar';
import { cn } from '@/lib/utils';

interface AvatarProps {
  fullName: string;
  className?: string;
}

export function Avatar({ fullName, className }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground',
        className,
      )}
      aria-label={fullName}
    >
      {getInitials(fullName)}
    </div>
  );
}
