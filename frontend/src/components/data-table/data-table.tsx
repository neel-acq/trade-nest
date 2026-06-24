'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  VisibilityState,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  total: number;
  page: number;
  limit: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onPageChange: (page: number) => void;
  onExportCsv?: () => void;
  isLoading?: boolean;
  searchPlaceholder?: string;
  meta?: Record<string, unknown>;
}

export function DataTable<T>({
  columns,
  data,
  total,
  page,
  limit,
  searchValue = '',
  onSearchChange,
  onPageChange,
  onExportCsv,
  isLoading,
  searchPlaceholder = 'Search...',
  meta,
}: DataTableProps<T>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / limit) || 1,
    meta,
  });

  const visibleColumns = useMemo(
    () => table.getAllColumns().filter((col) => col.getCanHide() && col.id !== 'actions'),
    [table],
  );

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {onSearchChange && (
          <Input
            className="max-w-xs h-9 bg-background"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        )}
        {onExportCsv && (
          <Button variant="outline" size="sm" onClick={onExportCsv}>
            Export CSV
          </Button>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          {visibleColumns.map((column) => (
            <label key={column.id} className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                onChange={column.getToggleVisibilityHandler()}
              />
              {column.id}
            </label>
          ))}
        </div>
      </div>

      <div className="trading-panel overflow-x-auto">
        <table className="trading-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="text-left">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted-foreground py-8">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted-foreground py-8">
                  No results.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Page {page} of {totalPages} ({total} total)
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export function exportToCsv<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  columns: { key: keyof T; label: string }[],
) {
  const header = columns.map((c) => c.label).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = row[c.key];
          const str = val === null || val === undefined ? '' : String(val);
          return str.includes(',') ? `"${str}"` : str;
        })
        .join(','),
    )
    .join('\n');

  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
