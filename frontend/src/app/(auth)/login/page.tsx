'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CandlestickChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';
import { loginRequest } from '@/lib/auth';
import { loginSchema, type LoginFormValues } from '@/schemas/login.schema';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    try {
      const response = await loginRequest(values.username, values.password);
      setAuth(response.accessToken, response.user);
      router.push('/dashboard');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Login failed. Please try again.';
      setError(message);
    }
  };

  return (
    <div className="trading-theme min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/25 via-background to-background" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.25)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.25)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="relative flex flex-col justify-center p-12 max-w-lg">
          <Link href="/" className="font-bold text-2xl tracking-tight mb-8">
            Trade<span className="text-primary">Nest</span>
          </Link>
          <h1 className="text-3xl font-bold leading-tight">
            Your professional simulated trading terminal
          </h1>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Practice Indian equity trading with live order books, real matching, portfolio tracking,
            and WebSocket price updates — all in a risk-free environment.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CandlestickChart className="h-4 w-4 text-primary shrink-0" />
              50+ NSE stocks with charts & depth
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gain shrink-0" />
              LIMIT & MARKET orders with matching engine
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              ₹10,00,000 starting wallet balance
            </li>
          </ul>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden text-center">
            <Link href="/" className="font-bold text-xl">
              Trade<span className="text-primary">Nest</span>
            </Link>
          </div>

          <div className="trading-panel p-8">
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl font-bold">Sign in</h2>
              <p className="text-sm text-muted-foreground">
                Enter your credentials to access the trading terminal
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  className="h-10 bg-background"
                  placeholder="trader_01"
                  {...register('username')}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-10 bg-background"
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in to terminal'}
              </Button>
            </form>

            <div className="mt-6 rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground space-y-1">
              <p>
                <span className="text-foreground font-medium">Trader:</span> trader_01 / TradeNest@123
              </p>
              <p>
                <span className="text-foreground font-medium">Admin:</span> admin_01 / TradeNest@123
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="text-primary hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
