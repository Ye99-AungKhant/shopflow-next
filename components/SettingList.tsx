"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRightLeft,
  Download,
  Edit,
  Eye,
  MapPin,
  MoreHorizontal,
  Package,
  Phone,
  Plus,
  Printer,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { DeleteOrderModal } from "./orders/DeleteOrderModal";
import { EditOrderModal } from "./orders/EditOrderModal";
import { UpdateStatusModal } from "./orders/UpdateStatusModal";
import { ViewOrderModal } from "./orders/ViewOrderModal";
import {
  fetchOrders,
  type OrderListRow,
  type OrderStatus,
} from "../lib/orders";
import { Delivery, isSupabaseConfigured } from "../lib/supabase";
import { updateDelivery } from "../lib/delivery";
import {
  cn,
  getStatusClass,
  getStatusLabel,
  useAutoFlipDropdown,
} from "../lib/utils";
import { ColumnDef, DataTable } from "./ui/DataTable";
import { MobileDataTable } from "./ui/MobileDataTable";
import { useGetDeliveries } from "@/hooks/delivery";
import { DeliverySettings } from "./settings/DeliverySettings";
import { DeliveryModal } from "./settings/DeliveryModal";

type FilterTab = string;
const pageSizeOptions = [10, 50, 100] as const;
type ActiveModal =
  | "view"
  | "edit"
  | "update-status"
  | "delete"
  | "create-delivery"
  | "edit-delivery"
  | null;

export type OpenModal = (
  type: ActiveModal,
  order: OrderListRow,
  initialStatus?: OrderStatus | null,
) => void;

const tabs: { id: FilterTab; label: string }[] = [
  // { id: "category", label: "Category" },
  { id: "delivery", label: "Delivery" },
];

export function SettingList({ refreshTrigger }: { refreshTrigger: number }) {
  const [activeTab, setActiveTab] = useState<FilterTab>("delivery");
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =
    useState<(typeof pageSizeOptions)[number]>(10);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderListRow | null>(null);
  const [statusModalInitialValue, setStatusModalInitialValue] =
    useState<OrderStatus | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuAnchorRef = useRef<HTMLDivElement | null>(null);
  const isMenuFlipped = useAutoFlipDropdown(
    menuAnchorRef,
    Boolean(openMenuId),
    setOpenMenuId,
  );
  const queryClient = useQueryClient();

  const updateDeliveryStatusMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateDelivery(id, { enabled }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
  });

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchValue, pageSize]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      // Only close if the menu is open AND the click was outside of it
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const openModal: OpenModal = (type, order, initialStatus) => {
    setSelectedOrder(order);
    // setOpenMenuId(null);
    setStatusModalInitialValue(initialStatus ?? null);
    setActiveModal(type);
  };

  const openDeliveryModal = (
    type: "create-delivery" | "edit-delivery",
    delivery?: Delivery,
  ) => {
    setSelectedDelivery(delivery || null);
    setActiveModal(type);
  };

  function closeModal() {
    setActiveModal(null);
    setStatusModalInitialValue(null);
    setSelectedOrder(null);
    setSelectedDelivery(null);
  }

  const statusFilter = activeTab as OrderStatus | "all";

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: [
      "orders",
      refreshTrigger,
      statusFilter,
      searchValue,
      page,
      pageSize,
    ],
    queryFn: () =>
      fetchOrders({
        page,
        pageSize,
        search: searchValue,
        status: statusFilter,
      }),
    enabled: isSupabaseConfigured,
    placeholderData: (previousData) => previousData,
  });

  const {
    data: deliveries,
    isLoading: isLoadingDelivery,
    isFetched: isFetchedDelivery,
  } = useGetDeliveries();
  const orders = data?.rows ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageCount = data?.pageCount ?? 0;
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = totalCount === 0 ? 0 : startItem + orders.length - 1;

  const handleToggle = async (deli: Delivery) => {
    const newState = !deli.enabled;
    updateDeliveryStatusMutation.mutate({
      id: deli.id,
      enabled: newState,
    });
  };

  const deliColumns: ColumnDef<Delivery>[] = [
    {
      header: "Name",
      cell: (deli) => (
        <button className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700">
          {deli.name}
        </button>
      ),
    },
    {
      header: "Phone",
      cell: (deli) => (
        <span className="text-sm text-slate-600">{deli.phone ?? "-"}</span>
      ),
    },
    {
      header: "Address",
      cell: (deli) => (
        <span className="text-sm text-slate-600">{deli.address ?? "-"}</span>
      ),
    },
    {
      header: "Status",
      cell: (deli) => {
        return (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleToggle(deli)}
              className={`
            relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
            ${deli.enabled ? "bg-indigo-600" : "bg-slate-200"}
          `}
            >
              <span
                className={`
              pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${deli.enabled ? "translate-x-6" : "translate-x-1"}
            `}
              />
            </button>
            <span className="text-sm font-medium text-slate-700">
              {deli.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (deli) => (
        <button
          onClick={() => openDeliveryModal("edit-delivery", deli)}
          className="text-sm text-slate-700 hover:bg-slate-50"
        >
          <Edit className="h-4 w-4" />
        </button>
      ),
    },
  ];

  const renderOrderCard = (deli: Delivery) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="max-w-md mx-auto">
        {/* Header / Bulk Actions */}

        {/* Card List */}
        <div key={deli.id} className="">
          {/* Card Header */}
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-blue-700">{deli.name}</h3>
            </div>
            <button
              onClick={() => openDeliveryModal("edit-delivery", deli)}
              className="text-sm text-slate-700 hover:bg-slate-50"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>

          {/* Card Body (Conditional Rendering for empty fields) */}
          {(deli.phone || deli.address) && (
            <div className="p-4 space-y-3 bg-gray-50/50 rounded-xl">
              {deli.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm text-gray-600">{deli.phone}</span>
                </div>
              )}
              {deli.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-6 w-6" />
                  <span className="text-sm text-gray-600 leading-snug">
                    {deli.address}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Card Footer (Status Toggle) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleToggle(deli)}
              className={`
            relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
            ${deli.enabled ? "bg-indigo-600" : "bg-slate-200"}
          `}
            >
              <span
                className={`
              pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${deli.enabled ? "translate-x-6" : "translate-x-1"}
            `}
              />
            </button>
            <span className="text-sm font-medium text-slate-700">
              {deli.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <DeliveryModal
        isOpen={
          activeModal === "create-delivery" || activeModal === "edit-delivery"
        }
        onClose={closeModal}
        delivery={selectedDelivery}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:bg-white hover:text-slate-900",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative block w-full lg:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search Orders"
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
            onClick={() => openDeliveryModal("create-delivery")}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm">
          Please configure your Supabase URL and Anon Key in the environment
          variables to load orders.
        </div>
      )}

      {isSupabaseConfigured && isLoading && (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
          Loading orders...
        </div>
      )}

      {isSupabaseConfigured && isError && (
        <div className="rounded-3xl bg-white p-8 text-center text-rose-500 shadow-sm">
          Failed to load orders:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      {isSupabaseConfigured && !isLoading && !isError && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataTable
              data={deliveries || []}
              columns={deliColumns}
              isFetching={isFetching}
              hasSelection={true}
              keyExtractor={(deli) => deli.id}
              page={1}
              pageCount={1}
              startItem={1}
              endItem={deliveries ? deliveries.length : 0}
              totalCount={deliveries ? deliveries.length : 0}
              onPageChange={() => {}}
              emptyStateTitle="No deliveries found"
              emptyStateDescription="New deliveries from Supabase will appear here."
            />
          </div>

          <div className="block md:hidden">
            <MobileDataTable
              data={deliveries || []}
              isFetching={isFetching}
              page={page}
              pageCount={pageCount}
              startItem={startItem}
              endItem={endItem}
              totalCount={totalCount}
              onPageChange={setPage}
              keyExtractor={(deli) => deli.id}
              renderRow={renderOrderCard}
              emptyStateTitle="No deliveries found"
              emptyStateDescription="New orders from Supabase will appear here."
            />
          </div>
        </>
      )}
    </div>
  );
}
