"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Edit,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import {
  createCustomer,
  fetchCustomers,
  updateCustomer,
  type CustomerUpsertInput,
} from "@/lib/customers";
import type { Customer } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn, useAutoFlipDropdown } from "@/lib/utils";
import { CustomerFormModal } from "./CustomerFormModal";
import { DeleteCustomerModal } from "./DeleteCustomerModal";
import { ColumnDef, DataTable } from "./ui/DataTable";
import { MobileDataTable } from "./ui/MobileDataTable";
import { useAppSearch } from "./AppSearchContext";

const pageSizeOptions = [10, 50, 100] as const;

const avatarClasses = [
  "bg-rose-100 text-rose-600",
  "bg-sky-100 text-sky-600",
  "bg-violet-100 text-violet-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-700",
];

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function avatarClassForId(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return avatarClasses[sum % avatarClasses.length];
}

export function CustomerList() {
  const queryClient = useQueryClient();
  const { searchQuery } = useAppSearch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =
    useState<(typeof pageSizeOptions)[number]>(10);

  const [formOpen, setFormOpen] = useState(false);
  const [formCustomer, setFormCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const menuAnchorRef = useRef<HTMLDivElement | null>(null);
  const isMenuFlipped = useAutoFlipDropdown(
    menuAnchorRef,
    Boolean(openMenuId),
    setOpenMenuId,
  );

  const {
    data = [],
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["customers", searchQuery],
    queryFn: () => fetchCustomers(searchQuery),
    enabled: isSupabaseConfigured,
    placeholderData: (previousData) => previousData,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      id?: string;
      values: CustomerUpsertInput;
    }) => {
      if (payload.id) {
        await updateCustomer(payload.id, payload.values);
      } else {
        await createCustomer(payload.values);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      setFormOpen(false);
      setFormCustomer(null);
    },
  });

  useEffect(() => {
    setPage(1);
  }, [searchQuery, pageSize]);

  const pageCount = Math.ceil(data.length / pageSize) || 1;

  useEffect(() => {
    if (page > pageCount && pageCount > 0) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const startItem = data.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(data.length, page * pageSize);
  const paginatedRows = data.slice((page - 1) * pageSize, page * pageSize);

  function openCreate() {
    saveMutation.reset();
    setFormCustomer(null);
    setFormOpen(true);
  }

  function openEdit(row: Customer) {
    saveMutation.reset();
    setFormCustomer(row);
    setFormOpen(true);
  }

  const columns: ColumnDef<Customer>[] = [
    {
      header: "Customer",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              avatarClassForId(row.id),
            )}
          >
            {getInitials(row.name) || <User className="h-4 w-4" />}
          </div>
          <span className="text-sm font-medium text-slate-900">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Phone",
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          {row.phone || "—"}
        </span>
      ),
    },
    {
      header: "Address",
      cell: (row) => (
        <span className="inline-flex items-start gap-1.5 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="line-clamp-2">{row.address || "—"}</span>
        </span>
      ),
    },
    {
      header: "Added",
      cell: (row) => (
        <span className="text-sm text-slate-600">
          {format(new Date(row.created_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (row) => (
        <div
          className="relative inline-block text-left"
          ref={openMenuId === row.id ? menuAnchorRef : null}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId((current) => (current === row.id ? null : row.id));
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Row actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {openMenuId === row.id && (
            <div
              className={cn(
                "absolute right-0 z-10 w-44 rounded-lg border border-slate-100 bg-white py-1 shadow-lg",
                isMenuFlipped ? "bottom-full mb-2" : "top-full mt-2",
              )}
            >
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setOpenMenuId(null);
                  openEdit(row);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setOpenMenuId(null);
                  setDeleteTarget(row);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  const renderCard = (row: Customer) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            avatarClassForId(row.id),
          )}
        >
          {getInitials(row.name) || <User className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {row.name}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="truncate">{row.phone || "No phone"}</span>
          </p>
          <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-2">{row.address || "No address"}</span>
          </p>
          <p className="mt-2 text-[11px] text-slate-400">
            Added {format(new Date(row.created_at), "MMM d, yyyy")}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => openEdit(row)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const saveError =
    saveMutation.isError && saveMutation.error instanceof Error
      ? saveMutation.error.message
      : null;

  return (
    <div className="space-y-6">
      <CustomerFormModal
        isOpen={formOpen}
        customer={formCustomer}
        onClose={() => {
          setFormOpen(false);
          setFormCustomer(null);
          saveMutation.reset();
        }}
        onSave={(values) =>
          saveMutation.mutateAsync({ id: formCustomer?.id, values })
        }
        isSubmitting={saveMutation.isPending}
        serverError={saveError}
      />

      <DeleteCustomerModal
        isOpen={Boolean(deleteTarget)}
        customer={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />

      <div className="flex flex-row justify-between">
        <label className="flex h-8 items-center gap-2 rounded-xl border border-slate-200 bg-white px-1 text-sm text-slate-600 shadow-sm">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) =>
              setPageSize(
                Number(e.target.value) as (typeof pageSizeOptions)[number],
              )
            }
            className="bg-transparent font-medium text-slate-900 outline-none"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={openCreate}
          disabled={!isSupabaseConfigured || saveMutation.isPending}
          className="inline-flex h-8 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4 shrink-0" />
          New
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm">
          Please configure your Supabase URL and anon key to load customers.
        </div>
      )}

      {isSupabaseConfigured && isLoading && (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
          Loading customers...
        </div>
      )}

      {isSupabaseConfigured && isError && (
        <div className="rounded-3xl bg-white p-8 text-center text-rose-500 shadow-sm">
          Failed to load customers:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      {isSupabaseConfigured && !isLoading && !isError && (
        <>
          <div className="hidden md:block">
            <DataTable
              data={paginatedRows}
              columns={columns}
              isFetching={isFetching}
              keyExtractor={(row) => row.id}
              page={page}
              pageCount={pageCount}
              startItem={startItem}
              endItem={endItem}
              totalCount={data.length}
              onPageChange={setPage}
              emptyStateTitle="No customers found"
              emptyStateDescription="Customers created from orders or imports will appear here."
            />
          </div>
          <div className="block md:hidden">
            <MobileDataTable
              data={paginatedRows}
              isFetching={isFetching}
              page={page}
              pageCount={pageCount}
              startItem={startItem}
              endItem={endItem}
              totalCount={data.length}
              onPageChange={setPage}
              keyExtractor={(row) => row.id}
              renderRow={renderCard}
              emptyStateTitle="No customers found"
              emptyStateDescription="Try another search or add customers via orders."
            />
          </div>
        </>
      )}
    </div>
  );
}
