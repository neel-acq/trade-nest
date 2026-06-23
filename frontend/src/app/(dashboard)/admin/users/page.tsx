'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useCallback, useEffect, useState } from 'react';
import { Avatar } from '@/components/avatar';
import { DataTable, exportToCsv } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import type { AuthUser } from '@/types';
import { deleteUser, fetchUsers } from '@/lib/users';
import { ApiError } from '@/lib/api';

const columns: ColumnDef<AuthUser, unknown>[] = [
  {
    id: 'avatar',
    header: '',
    cell: ({ row }) => <Avatar fullName={row.original.fullName} className="h-8 w-8 text-xs" />,
    enableHiding: false,
  },
  { accessorKey: 'username', header: 'Username', id: 'username' },
  { accessorKey: 'fullName', header: 'Full Name', id: 'fullName' },
  { accessorKey: 'email', header: 'Email', id: 'email' },
  { accessorKey: 'role', header: 'Role', id: 'role' },
  {
    accessorKey: 'isActive',
    header: 'Active',
    id: 'isActive',
    cell: ({ row }) => (row.original.isActive ? 'Yes' : 'No'),
  },
  {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: ({ row, table }) => {
      const onDelete = (table.options.meta as { onDelete?: (id: string) => void })?.onDelete;
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete?.(row.original.id)}
          disabled={!row.original.isActive}
        >
          Delete
        </Button>
      );
    },
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
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

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchUsers({
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setUsers(result.data);
      setTotal(result.meta.total);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDelete = async (id: string) => {
    if (!confirm('Soft delete this user?')) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  const handleExport = () => {
    exportToCsv(users as unknown as Record<string, unknown>[], 'users.csv', [
      { key: 'username' as keyof AuthUser, label: 'username' },
      { key: 'fullName' as keyof AuthUser, label: 'fullName' },
      { key: 'email' as keyof AuthUser, label: 'email' },
      { key: 'role' as keyof AuthUser, label: 'role' },
      { key: 'isActive' as keyof AuthUser, label: 'isActive' },
    ]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground text-sm">Admin user DataTable</p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        total={total}
        page={page}
        limit={limit}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        onPageChange={setPage}
        onExportCsv={handleExport}
        isLoading={loading}
        searchPlaceholder="Search users..."
        meta={{ onDelete: handleDelete }}
      />
    </div>
  );
}
