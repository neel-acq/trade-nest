'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useCallback, useEffect, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { PageHeader } from '@/components/trading/page-header';
import type { SafeWalletWithUser } from '@/types';
import { fetchWallets, formatInr } from '@/lib/wallets';

const columns: ColumnDef<SafeWalletWithUser, unknown>[] = [
  { accessorKey: 'user.username', header: 'Username', id: 'username', cell: ({ row }) => row.original.user.username },
  { accessorKey: 'user.fullName', header: 'Name', id: 'fullName', cell: ({ row }) => row.original.user.fullName },
  {
    accessorKey: 'balance',
    header: 'Balance',
    id: 'balance',
    cell: ({ row }) => formatInr(row.original.balance),
  },
  {
    accessorKey: 'lockedBalance',
    header: 'Locked',
    id: 'lockedBalance',
    cell: ({ row }) => formatInr(row.original.lockedBalance),
  },
  {
    accessorKey: 'availableBalance',
    header: 'Available',
    id: 'availableBalance',
    cell: ({ row }) => formatInr(row.original.availableBalance),
  },
];

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<SafeWalletWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchWallets({
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy: 'balance',
        sortOrder: 'desc',
      });
      setWallets(result.data);
      setTotal(result.meta.total);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Wallet Management"
        description="View balances, locked funds, and available cash across all users"
      />

      <DataTable
        columns={columns}
        data={wallets}
        total={total}
        page={page}
        limit={limit}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        onPageChange={setPage}
        isLoading={loading}
        searchPlaceholder="Search by user..."
      />
    </div>
  );
}
