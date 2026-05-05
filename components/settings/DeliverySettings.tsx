"use client";

import { useMemo, useState } from "react";
import { PackagePlus, Search, Trash2, Plus, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef, DataTable } from "../ui/DataTable";
import { MobileDataTable } from "../ui/MobileDataTable";
import { cn } from "@/lib/utils";

export type DeliveryItem = {
  id: string;
  order_id: string;
  name: string;
  phone: string;
  address?: string;
  created_at: string;
};

export type DeliveryCreateInput = {
  orderId: string;
  name: string;
  phone: string;
  address?: string;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

async function loadDeliveries() {
  const response = await fetch("/api/delivery");
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load delivery records.");
  }
  return payload as DeliveryItem[];
}

export function DeliverySettings({
  refreshTrigger,
}: {
  refreshTrigger: number;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: deliveries,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<DeliveryItem[], Error>({
    queryKey: ["delivery-list", refreshTrigger],
    queryFn: loadDeliveries,
    keepPreviousData: true,
  });

  const createDeliveryMutation = useMutation({
    mutationFn: async (payload: DeliveryCreateInput) => {
      const response = await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Failed to create delivery record.");
      }
      return result as DeliveryItem;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(["delivery-list"]);
      setOrderId("");
      setRecipient("");
      setPhone("");
      setAddress("");
      setFormError(null);
      setIsFormOpen(false);
    },
  });

  const deleteDeliveryMutation = useMutation({
    mutationFn: async (deliveryId: string) => {
      const response = await fetch(`/api/delivery/${deliveryId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Failed to delete delivery record.");
      }
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(["delivery-list"]);
    },
  });

  const filteredDeliveries = useMemo(() => {
    if (!deliveries) {
      return [];
    }
    const query = search.trim().toLowerCase();
    if (!query) {
      return deliveries;
    }
    return deliveries.filter(
      (delivery) =>
        delivery.order_id.toLowerCase().includes(query) ||
        delivery.name.toLowerCase().includes(query) ||
        delivery.phone.toLowerCase().includes(query) ||
        (delivery.address ?? "").toLowerCase().includes(query),
    );
  }, [deliveries, search]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!orderId.trim() || !recipient.trim() || !phone.trim()) {
      setFormError("Order ID, recipient name, and phone are required.");
      return;
    }

    await createDeliveryMutation.mutateAsync({
      orderId: orderId.trim(),
      name: recipient.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
    });
  };

  const columns: ColumnDef<DeliveryItem>[] = [
    {
      header: "Order",
      cell: (item) => (
        <div className="text-sm font-semibold text-slate-900">
          #{item.order_id.slice(0, 8).toUpperCase()}
        </div>
      ),
    },
    {
      header: "Recipient",
      cell: (item) => (
        <span className="text-sm text-slate-700">{item.name}</span>
      ),
    },
    {
      header: "Phone",
      cell: (item) => (
        <span className="text-sm text-slate-700">{item.phone}</span>
      ),
    },
    {
      header: "Address",
      cell: (item) => (
        <span className="text-sm text-slate-500">
          {item.address ?? "No address"}
        </span>
      ),
    },
    {
      header: "Created",
      cell: (item) => (
        <span className="text-sm text-slate-500">
          {formatDate(item.created_at)}
        </span>
      ),
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (item) => (
        <button
          type="button"
          onClick={() => deleteDeliveryMutation.mutate(item.id)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      ),
    },
  ];

  const renderDeliveryCard = (delivery: DeliveryItem) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <PackagePlus className="h-4 w-4" />
            <span>Order #{delivery.order_id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm text-slate-500">Recipient</p>
            <p className="font-semibold text-slate-900">{delivery.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Phone</p>
            <p className="text-sm text-slate-900">{delivery.phone}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Address</p>
            <p className="text-sm text-slate-700">
              {delivery.address ?? "No address provided"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {formatDate(delivery.created_at)}
          </span>
          <button
            type="button"
            onClick={() => deleteDeliveryMutation.mutate(delivery.id)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Delivery settings
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Create delivery records and link them to orders.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen((current) => !current)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {isFormOpen ? "Hide form" : "New delivery"}
          </button>
        </div>

        {isFormOpen && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Order ID
                <input
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Recipient name
                <input
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Phone
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Address (optional)
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
            </div>

            {formError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={createDeliveryMutation.isLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createDeliveryMutation.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save delivery"
                )}
              </button>
              <p className="text-sm text-slate-500">
                A delivery record is linked to an existing order and sets the
                order status to delivery.
              </p>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Delivery records
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Manage active delivery assignments and link them to orders.
            </p>
          </div>
          <label className="relative block w-full max-w-xs">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search deliveries"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
        </div>

        {isError && (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error?.message ?? "Unable to load deliveries."}
          </div>
        )}

        {isLoading ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            Loading deliveries...
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="hidden md:block">
              <DataTable
                data={filteredDeliveries}
                columns={columns}
                isFetching={isFetching}
                keyExtractor={(item) => item.id}
                page={1}
                pageCount={1}
                startItem={filteredDeliveries.length === 0 ? 0 : 1}
                endItem={filteredDeliveries.length}
                totalCount={filteredDeliveries.length}
                onPageChange={() => undefined}
                emptyStateTitle="No deliveries found"
                emptyStateDescription="Create a new delivery record to get started."
              />
            </div>

            <div className="block md:hidden">
              <MobileDataTable
                data={filteredDeliveries}
                renderRow={renderDeliveryCard}
                isFetching={isFetching}
                keyExtractor={(item) => item.id}
                page={1}
                pageCount={1}
                startItem={filteredDeliveries.length === 0 ? 0 : 1}
                endItem={filteredDeliveries.length}
                totalCount={filteredDeliveries.length}
                onPageChange={() => undefined}
                emptyStateTitle="No deliveries found"
                emptyStateDescription="Create a new delivery record to get started."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
