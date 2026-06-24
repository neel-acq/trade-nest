'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Panel } from '@/components/trading/panel';
import { ApiError, NetworkError } from '@/lib/api';
import { formatPrice, priceClass } from '@/lib/format';
import { createOrder } from '@/lib/orders';
import { orderSchema, toOrderType, type OrderFormValues } from '@/schemas/order.schema';
import type { SafeStock } from '@/types';
import { cn } from '@/lib/utils';

interface OrderTicketProps {
  stock: SafeStock;
  defaultSide?: 'BUY' | 'SELL';
  onSuccess?: () => void;
  className?: string;
}

export function OrderTicket({ stock, defaultSide = 'BUY', onSuccess, className }: OrderTicketProps) {
  const [side, setSide] = useState<'BUY' | 'SELL'>(defaultSide);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      orderMode: 'LIMIT',
      side,
      quantity: 1,
      price: stock.currentPrice,
    },
  });

  const orderMode = watch('orderMode');
  const quantity = watch('quantity') || 0;
  const price = watch('price') || stock.currentPrice;
  const estimatedValue = orderMode === 'LIMIT' ? quantity * price : quantity * stock.currentPrice;

  const switchSide = (next: 'BUY' | 'SELL') => {
    setSide(next);
    setValue('side', next);
    setError(null);
  };

  const onSubmit = async (values: OrderFormValues) => {
    setError(null);
    try {
      await createOrder({
        stockId: stock.id,
        type: toOrderType(values.side, values.orderMode),
        quantity: values.quantity,
        ...(values.orderMode === 'LIMIT' ? { price: values.price } : {}),
      });
      onSuccess?.();
    } catch (err) {
      if (err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : 'Order failed');
      }
    }
  };

  return (
    <Panel title="Order Ticket" className={className} dense>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-1 rounded-md bg-secondary/60 p-1">
          <button
            type="button"
            onClick={() => switchSide('BUY')}
            className={cn(
              'rounded py-2 text-sm font-semibold transition-colors',
              side === 'BUY' ? 'bg-gain text-white' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => switchSide('SELL')}
            className={cn(
              'rounded py-2 text-sm font-semibold transition-colors',
              side === 'SELL' ? 'bg-loss text-white' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            SELL
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{stock.symbol}</span>
          <span className={priceClass}>LTP {formatPrice(stock.currentPrice)}</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input type="hidden" {...register('side')} value={side} />

          <div className="space-y-1.5">
            <Label className="text-xs">Order type</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...register('orderMode')}
            >
              <option value="LIMIT">Limit</option>
              <option value="MARKET">Market</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-qty" className="text-xs">
              Quantity
            </Label>
            <Input id="ticket-qty" type="number" min={1} className="h-9" {...register('quantity')} />
            {errors.quantity && (
              <p className="text-xs text-destructive">{errors.quantity.message}</p>
            )}
          </div>

          {orderMode === 'LIMIT' && (
            <div className="space-y-1.5">
              <Label htmlFor="ticket-price" className="text-xs">
                Price (₹)
              </Label>
              <Input
                id="ticket-price"
                type="number"
                step="0.01"
                className={cn('h-9', priceClass)}
                {...register('price')}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
          )}

          <div className="rounded-md bg-secondary/40 px-3 py-2 text-xs flex justify-between">
            <span className="text-muted-foreground">Est. value</span>
            <span className={cn('font-semibold', priceClass)}>{formatPrice(estimatedValue)}</span>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            type="submit"
            variant={side === 'BUY' ? 'buy' : 'sell'}
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Placing...' : `${side} ${stock.symbol}`}
          </Button>
        </form>
      </div>
    </Panel>
  );
}
