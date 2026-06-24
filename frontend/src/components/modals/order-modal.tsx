'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, NetworkError } from '@/lib/api';
import { createOrder } from '@/lib/orders';
import { orderSchema, toOrderType, type OrderFormValues } from '@/schemas/order.schema';
import type { SafeStock } from '@/types';

interface OrderModalProps {
  stock: SafeStock;
  side: 'BUY' | 'SELL';
  onClose: () => void;
  onSuccess?: () => void;
}

export function OrderModal({ stock, side, onClose, onSuccess }: OrderModalProps) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
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
      onClose();
    } catch (err) {
      if (err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : 'Order failed');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-lg sm:rounded-lg border bg-card p-4 sm:p-6 shadow-lg">
        <h2 className="text-lg font-bold">
          {side} {stock.symbol}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">{stock.companyName}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('side')} />
          <div className="space-y-2">
            <Label>Order type</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...register('orderMode')}
            >
              <option value="LIMIT">Limit</option>
              <option value="MARKET">Market</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" type="number" min={1} {...register('quantity')} />
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity.message}</p>
            )}
          </div>
          {orderMode === 'LIMIT' && (
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input id="price" type="number" step="0.01" {...register('price')} />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? 'Placing...' : `Place ${side} Order`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
