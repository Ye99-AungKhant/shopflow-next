import React from "react";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileDataTableProps<T> {
  data: T[];
  isFetching?: boolean;
  page: number;
  pageCount: number;
  startItem: number;
  endItem: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  renderRow: (item: T) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
}

export const MobileDataTable = <T,>({
  data,
  isFetching,
  page,
  pageCount,
  startItem,
  endItem,
  totalCount,
  onPageChange,
  emptyStateTitle = "No results found",
  emptyStateDescription = "Try adjusting your filters.",
  renderRow,
  keyExtractor = (_item, index) => `row-${index}`,
}: MobileDataTableProps<T>) => {
  return (
    <div className="flex flex-col gap-4">
      {/* 1. Data/Content Area */}
      <div
        className={cn(
          "min-h-[200px] transition-opacity",
          isFetching ? "opacity-50" : "opacity-100",
        )}
      >
        {data.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm border border-slate-100">
            <Package className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <h3 className="font-medium text-slate-700">{emptyStateTitle}</h3>
            <p className="text-sm text-slate-500">{emptyStateDescription}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={keyExtractor(item, index)}>{renderRow(item)}</div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Unified Pagination Footer */}
      <div className="mt-2 flex flex-col items-center gap-4 rounded-xl bg-white p-4 border border-slate-200 shadow-sm">
        <div className="text-xs font-medium text-slate-500">
          Showing <span className="text-slate-900">{startItem}</span> to{" "}
          <span className="text-slate-900">{endItem}</span> of{" "}
          <span className="text-slate-900">{totalCount}</span>
        </div>

        <div className="flex w-full items-center justify-between gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 transition active:scale-95 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <div className="px-4 text-xs font-bold text-slate-400">
            {page} / {pageCount}
          </div>

          <button
            onClick={() => onPageChange(Math.min(pageCount, page + 1))}
            disabled={page >= pageCount}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 transition active:scale-95 disabled:opacity-30"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
