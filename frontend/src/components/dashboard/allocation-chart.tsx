'use client';

import Link from 'next/link';
import type { AllocationSlice } from '@/types';
import { formatInr } from '@/lib/wallets';

export function AllocationChart({ allocation }: { allocation: AllocationSlice[] }) {
  if (allocation.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No holdings yet.{' '}
        <Link href="/stocks" className="text-primary hover:underline">
          Start trading
        </Link>
      </p>
    );
  }

  const colors = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];

  return (
    <div className="space-y-3">
      {allocation.slice(0, 6).map((slice, index) => (
        <div key={slice.symbol}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{slice.symbol}</span>
            <span className="text-muted-foreground">
              {slice.weight}% · {formatInr(slice.currentValue)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(slice.weight, 2)}%`,
                backgroundColor: colors[index % colors.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
