import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'buy' | 'sell';
  size?: 'default' | 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
          size === 'default' && 'h-10 px-4 py-2 text-sm',
          size === 'sm' && 'h-8 px-3 text-xs',
          size === 'lg' && 'h-11 px-6 text-sm',
          variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
          variant === 'outline' &&
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
          variant === 'buy' && 'bg-gain text-white hover:bg-gain/90 font-semibold',
          variant === 'sell' && 'bg-loss text-white hover:bg-loss/90 font-semibold',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button };
