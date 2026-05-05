"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  MoreHorizontal,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AddItemModal } from "./AddItemModal";
import { AdjustStockModal } from "./AdjustStockModal";
import { DeleteItemModal } from "./DeleteItemModal";
import { EditItemModal } from "./EditItemModal";
import { InventoryItem, isSupabaseConfigured, supabase } from "../lib/supabase";
import { ColumnDef, DataTable } from "./ui/DataTable";
import { MobileDataTable } from "./ui/MobileDataTable";
import Image from "next/image";

const tabs = ["All Items", "Active", "Low Stock", "Out of Stock"] as const;
const pageSizeOptions = [10, 50, 100] as const;

type Tab = (typeof tabs)[number];

type InventoryRow = InventoryItem & {
  category: string;
  stockStatus: "healthy" | "low" | "out";
};

async function fetchInventory(): Promise<InventoryRow[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from<InventoryItem>("inventory")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => {
    const stockStatus: "healthy" | "low" | "out" =
      item.stock_quantity === 0
        ? "out"
        : item.stock_quantity < 20
          ? "low"
          : "healthy";

    return {
      ...item,
      category: "General",
      stockStatus,
      cost: item.cost ?? 0, // Ensure cost is included
    };
  });
}

function renderStockBadge(item: InventoryRow) {
  if (item.stockStatus === "healthy") {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        {item.stock_quantity} in stock
      </span>
    );
  }

  if (item.stockStatus === "low") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        {item.stock_quantity} Low stock
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
      0 Out of stock
    </span>
  );
}

export function InventoryList() {
  const [activeTab, setActiveTab] = useState<Tab>("All Items");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =
    useState<(typeof pageSizeOptions)[number]>(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMenuRow, setActiveMenuRow] = useState<string | null>(null);
  const [activeRow, setActiveRow] = useState<InventoryRow | null>(null);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isDeleteItemOpen, setIsDeleteItemOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const addItemMutation = useMutation({
    mutationFn: async (item: Omit<InventoryItem, "id" | "created_at">) => {
      if (!supabase) {
        throw new Error("Supabase is not configured");
      }

      const { data, error } = await supabase
        .from("inventory")
        .insert([item])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setIsAddModalOpen(false);
      setToast({ message: "Item added successfully.", type: "success" });
    },
    onError: (error) => {
      setToast({
        message:
          (error as Error).message || "Unable to add item. Please try again.",
        type: "error",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      data: Partial<InventoryItem>;
    }) => {
      if (!supabase) {
        throw new Error("Supabase is not configured");
      }

      const { data, error } = await supabase
        .from("inventory")
        .update(payload.data)
        .eq("id", payload.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setIsEditItemOpen(false);
      setActiveRow(null);
      setToast({ message: "Item updated successfully.", type: "success" });
    },
    onError: (error) => {
      setToast({
        message:
          (error as Error).message ||
          "Unable to update item. Please try again.",
        type: "error",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) {
        throw new Error("Supabase is not configured");
      }

      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) {
        throw error;
      }
      return true;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setIsDeleteItemOpen(false);
      setActiveRow(null);
      setToast({ message: "Item deleted successfully.", type: "success" });
    },
    onError: (error) => {
      setToast({
        message:
          (error as Error).message ||
          "Unable to delete item. Please try again.",
        type: "error",
      });
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: async (payload: { id: string; stock_quantity: number }) => {
      if (!supabase) {
        throw new Error("Supabase is not configured");
      }

      const { data, error } = await supabase
        .from<InventoryItem>("inventory")
        .update({ stock_quantity: payload.stock_quantity })
        .eq("id", payload.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setIsAdjustStockOpen(false);
      setActiveRow(null);
      setToast({ message: "Stock updated successfully.", type: "success" });
    },
    onError: (error) => {
      setToast({
        message:
          (error as Error).message ||
          "Unable to update stock. Please try again.",
        type: "error",
      });
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["inventory"],
    queryFn: fetchInventory,
    enabled: isSupabaseConfigured,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const inventoryRows = data ?? [];

  const filteredRows = useMemo(
    () =>
      inventoryRows.filter((row) => {
        const searchTerm = search.toLowerCase();
        const matchesSearch =
          row.name.toLowerCase().includes(searchTerm) ||
          (row.sku ?? "").toLowerCase().includes(searchTerm);

        const matchesTab =
          activeTab === "All Items" ||
          (activeTab === "Active" && row.stock_quantity > 0) ||
          (activeTab === "Low Stock" &&
            row.stock_quantity > 0 &&
            row.stock_quantity < 20) ||
          (activeTab === "Out of Stock" && row.stock_quantity === 0);

        return matchesSearch && matchesTab;
      }),
    [activeTab, inventoryRows, search],
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, pageSize]);

  const pageCount = Math.ceil(filteredRows.length / pageSize);

  useEffect(() => {
    if (page > pageCount && pageCount > 0) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const startItem = filteredRows.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(filteredRows.length, page * pageSize);
  const paginatedRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const columns: ColumnDef<InventoryRow>[] = [
    {
      header: "Product",
      cell: (row) => (
        <div className="flex items-center gap-3">
          {/* <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <span className="text-sm font-semibold">{row.}</span>
          </div> */}
          <Image
            src={row.photo_url ?? "/placeholder.png"}
            alt={row.name}
            width={40}
            height={40}
            className="rounded-xl object-cover"
          />
          <div>
            <p className="text-sm font-semibold text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-400">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      header: "SKU",
      accessorKey: "sku",
      cellClassName: "text-sm text-slate-600",
    },
    {
      header: "Cost",
      cell: (row) => (
        <span className="font-medium text-slate-900">
          ${row.cost?.toFixed(2) ?? "0.00"}
        </span>
      ),
      cellClassName: "text-sm",
    },
    {
      header: "Price",
      cell: (row) => (
        <span className="font-medium text-slate-900">
          ${row.price.toFixed(2)}
        </span>
      ),
      cellClassName: "text-sm",
    },
    {
      header: "Stock",
      cell: (row) => renderStockBadge(row),
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (row) => (
        <div className="relative inline-block text-right">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuRow((current) =>
                current === row.id ? null : row.id,
              );
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {activeMenuRow === row.id && (
            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-slate-100 bg-white shadow-lg">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuRow(null);
                  setActiveRow(row);
                  setIsAdjustStockOpen(true);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <PackagePlus className="h-4 w-4" />
                Adjust Stock
              </button>
              <div className="border-b border-slate-100" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuRow(null);
                  setActiveRow(row);
                  setIsEditItemOpen(true);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Edit Details
              </button>
              <div className="border-b border-slate-100" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuRow(null);
                  setActiveRow(row);
                  setIsDeleteItemOpen(true);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Item
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  const renderInventoryCard = (item: InventoryRow) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {item.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              {item.sku ?? "No SKU"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">
            ${item.price.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500">Cost ${item.cost.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <Image
          src={item.photo_url ?? "/placeholder.png"}
          alt={item.name}
          width={44}
          height={44}
          className="h-11 w-11 rounded-xl object-cover"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">{item.category}</p>
          <p className="text-xs text-slate-500">
            {item.stock_quantity} in stock
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {renderStockBadge(item)}
        <div className="relative inline-block text-left">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuRow((current) =>
                current === item.id ? null : item.id,
              );
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {activeMenuRow === item.id && (
            <div className="absolute right-0 z-10 w-48 rounded-lg border border-slate-100 bg-white shadow-lg">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuRow(null);
                  setActiveRow(item);
                  setIsAdjustStockOpen(true);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <PackagePlus className="h-4 w-4" />
                Adjust Stock
              </button>
              <div className="border-b border-slate-100" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuRow(null);
                  setActiveRow(item);
                  setIsEditItemOpen(true);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Edit Details
              </button>
              <div className="border-b border-slate-100" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuRow(null);
                  setActiveRow(item);
                  setIsDeleteItemOpen(true);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!isSupabaseConfigured) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-center text-slate-500 bg-white rounded-2xl m-4 border border-slate-200 border-dashed shadow-sm">
        <p>
          Please configure your Supabase URL and Anon Key in the environment
          variables to view inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-50 min-h-full">
      {toast ? (
        <div className="fixed right-4 top-4 z-50 pointer-events-none">
          <div
            className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-sm transition ${
              toast.type === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-rose-100 bg-rose-50 text-rose-700"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(product) => addItemMutation.mutate(product)}
        isSubmitting={addItemMutation.isPending}
      />

      <AdjustStockModal
        isOpen={isAdjustStockOpen}
        onClose={() => {
          setIsAdjustStockOpen(false);
          setActiveRow(null);
        }}
        productName={activeRow?.name}
        currentStock={activeRow?.stock_quantity ?? 0}
        onConfirm={({ type, amount }) => {
          if (!activeRow) {
            return;
          }
          const nextStock =
            type === "add"
              ? activeRow.stock_quantity + amount
              : type === "subtract"
                ? Math.max(activeRow.stock_quantity - amount, 0)
                : amount;
          adjustStockMutation.mutate({
            id: activeRow.id,
            stock_quantity: nextStock,
          });
        }}
        isSubmitting={adjustStockMutation.isPending}
      />

      <EditItemModal
        isOpen={isEditItemOpen}
        onClose={() => {
          setIsEditItemOpen(false);
          setActiveRow(null);
        }}
        initialData={
          activeRow
            ? {
                name: activeRow.name,
                sku: activeRow.sku ?? "",
                price: activeRow.price,
                cost: activeRow.cost ?? 0,
                stock_quantity: activeRow.stock_quantity,
              }
            : {
                name: "",
                sku: "",
                price: 0,
                cost: 0,
                stock_quantity: 0,
              }
        }
        onSave={(product) =>
          activeRow &&
          updateItemMutation.mutate({ id: activeRow.id, data: product })
        }
        isSubmitting={updateItemMutation.isPending}
      />

      <DeleteItemModal
        isOpen={isDeleteItemOpen}
        onClose={() => {
          setIsDeleteItemOpen(false);
          setActiveRow(null);
        }}
        productName={activeRow?.name}
        onDelete={() => activeRow && deleteItemMutation.mutate(activeRow.id)}
        isDeleting={deleteItemMutation.isPending}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:bg-white hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products or SKUs..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(event) =>
                setPageSize(
                  Number(
                    event.target.value,
                  ) as (typeof pageSizeOptions)[number],
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
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      <div className="hidden md:block rounded-xl bg-white shadow-sm">
        <DataTable
          data={paginatedRows}
          columns={columns}
          isFetching={isLoading}
          keyExtractor={(row) => row.id}
          page={page}
          pageCount={pageCount}
          startItem={startItem}
          endItem={endItem}
          totalCount={filteredRows.length}
          onPageChange={setPage}
          emptyStateTitle={
            isLoading ? "Loading inventory..." : "No matching products found"
          }
          emptyStateDescription={
            isLoading
              ? "Please wait while inventory loads."
              : "Try adjusting filters or search."
          }
        />
      </div>

      <div className="block md:hidden">
        <MobileDataTable
          data={paginatedRows}
          isFetching={isLoading}
          page={page}
          pageCount={pageCount}
          startItem={startItem}
          endItem={endItem}
          totalCount={filteredRows.length}
          onPageChange={setPage}
          keyExtractor={(item) => item.id}
          renderRow={renderInventoryCard}
          emptyStateTitle={
            isLoading ? "Loading inventory..." : "No matching products found"
          }
          emptyStateDescription={
            isLoading
              ? "Please wait while inventory loads."
              : "Try adjusting filters or search."
          }
        />
      </div>
    </div>
  );
}
