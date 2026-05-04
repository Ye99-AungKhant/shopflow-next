"use client";

import React from "react";
import { Package } from "lucide-react"; // Assuming you use lucide-react

// Define the shape of a Column
export interface ColumnDef<T> {
  header: React.ReactNode;
  accessorKey?: keyof T; // Used for simple text rendering
  cell?: (item: T) => React.ReactNode; // Used for custom rendering (badges, avatars, actions)
  headerClassName?: string; // For alignment (e.g., text-right)
  cellClassName?: string; // For alignment
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isFetching?: boolean;

  // Empty State Config
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateIcon?: React.ReactNode;

  // Pagination Config
  page: number;
  pageCount: number;
  startItem: number;
  endItem: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;

  // Selection (Optional)
  hasSelection?: boolean;
  onSelectAll?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectRow?: (item: T, e: React.ChangeEvent<HTMLInputElement>) => void;

  // A unique key accessor for the map function (usually 'id')
  keyExtractor: (item: T) => string | number;
}

export function DataTable<T>({
  data,
  columns,
  isFetching,
  emptyStateTitle = "No results found",
  emptyStateDescription = "Try adjusting your filters or search.",
  emptyStateIcon = <Package className="h-10 w-10 text-slate-300" />,
  page,
  pageCount,
  startItem,
  endItem,
  totalCount,
  onPageChange,
  hasSelection = false,
  onSelectAll,
  onSelectRow,
  keyExtractor,
}: DataTableProps<T>) {
  return (
    <div className="overflow-visible rounded-xl bg-white shadow-sm">
      {isFetching && (
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3 text-sm text-slate-500">
          Refreshing data...
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-white">
            <tr>
              {hasSelection && (
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    onChange={onSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500 ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasSelection ? 1 : 0)}
                  className="px-6 py-16 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center gap-3">
                    {emptyStateIcon}
                    <div>
                      <p className="font-medium text-slate-700">
                        {emptyStateTitle}
                      </p>
                      <p className="text-sm text-slate-500">
                        {emptyStateDescription}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="transition hover:bg-slate-50"
                >
                  {hasSelection && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        onChange={(e) => onSelectRow?.(item, e)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                  )}
                  {columns.map((col, idx) => (
                    <td
                      key={idx}
                      className={`px-6 py-4 ${col.cellClassName || ""}`}
                    >
                      {/* If a custom cell render is provided, use it. Otherwise, render the raw text based on the accessorKey */}
                      {col.cell
                        ? col.cell(item)
                        : col.accessorKey
                          ? String(item[col.accessorKey])
                          : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {startItem} to {endItem} of {totalCount} results
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-2 text-slate-400">
            Page {pageCount === 0 ? 0 : page} of {pageCount}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pageCount, page + 1))}
            disabled={pageCount === 0 || page >= pageCount}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
