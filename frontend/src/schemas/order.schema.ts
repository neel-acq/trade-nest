import { z } from 'zod';

export const orderSchema = z
  .object({
    orderMode: z.enum(['LIMIT', 'MARKET']),
    side: z.enum(['BUY', 'SELL']),
    quantity: z.coerce.number().int().min(1, 'Min quantity 1'),
    price: z.coerce.number().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.orderMode === 'LIMIT' && (!data.price || data.price <= 0)) {
      ctx.addIssue({ code: 'custom', message: 'Price required for limit orders', path: ['price'] });
    }
  });

export type OrderFormValues = z.infer<typeof orderSchema>;

export function toOrderType(side: 'BUY' | 'SELL', mode: 'LIMIT' | 'MARKET') {
  return `${mode}_${side}` as 'LIMIT_BUY' | 'LIMIT_SELL' | 'MARKET_BUY' | 'MARKET_SELL';
}
