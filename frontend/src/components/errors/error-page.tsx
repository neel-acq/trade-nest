import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ErrorPageVariant = 'not-found' | 'server' | 'generic' | 'offline' | 'unauthorized';

const config: Record<
  ErrorPageVariant,
  { icon: typeof AlertTriangle; title: string; description: string; code?: string }
> = {
  'not-found': {
    icon: AlertTriangle,
    title: 'Page not found',
    description: 'The page you are looking for does not exist or may have been moved.',
    code: '404',
  },
  server: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    description: 'An unexpected server error occurred. Please try again in a moment.',
    code: '500',
  },
  generic: {
    icon: AlertTriangle,
    title: 'Unexpected error',
    description: 'Something went wrong while loading this page.',
  },
  offline: {
    icon: WifiOff,
    title: 'You are offline',
    description: 'Check your internet connection and try again when you are back online.',
  },
  unauthorized: {
    icon: AlertTriangle,
    title: 'Access denied',
    description: 'You do not have permission to view this page.',
    code: '403',
  },
};

interface ErrorPageProps {
  variant: ErrorPageVariant;
  message?: string;
  reset?: () => void;
  showHome?: boolean;
  showLogin?: boolean;
  tradingTheme?: boolean;
}

export function ErrorPage({
  variant,
  message,
  reset,
  showHome = true,
  showLogin = false,
  tradingTheme = true,
}: ErrorPageProps) {
  const { icon: Icon, title, description, code } = config[variant];

  return (
    <div
      className={
        tradingTheme
          ? 'trading-theme min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background text-foreground'
          : 'min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background text-foreground'
      }
    >
      <div className="trading-panel w-full max-w-md p-6 sm:p-8 text-center space-y-5">
        {code && (
          <p className="text-5xl sm:text-6xl font-bold text-primary/80 font-mono tabular-nums">{code}</p>
        )}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <Icon className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{message ?? description}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          {reset && (
            <Button variant="outline" onClick={reset} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          )}
          {showHome && (
            <Link
              href="/"
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          )}
          {showLogin && (
            <Link
              href="/login"
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </Link>
          )}
          {variant === 'not-found' && (
            <Link
              href="/dashboard"
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
