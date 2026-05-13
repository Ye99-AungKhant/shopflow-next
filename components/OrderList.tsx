"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRightLeft,
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  Package,
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
import { isSupabaseConfigured } from "../lib/supabase";
import {
  cn,
  getStatusClass,
  getStatusLabel,
  useAutoFlipDropdown,
} from "../lib/utils";
import { ColumnDef, DataTable } from "./ui/DataTable";
import { MobileDataTable } from "./ui/MobileDataTable";

type FilterTab = "all" | OrderStatus;
const pageSizeOptions = [10, 50, 100] as const;
type ActiveModal = "view" | "edit" | "update-status" | "delete" | null;

export type OpenModal = (
  type: ActiveModal,
  order: OrderListRow,
  initialStatus?: OrderStatus | null,
) => void;

const tabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending" },
  { id: "in_delivery", label: "In Delivery" },
  { id: "completed", label: "Completed" },
  { id: "canceled", label: "Canceled" },
];

export function OrderList({ refreshTrigger }: { refreshTrigger: number }) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =
    useState<(typeof pageSizeOptions)[number]>(10);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderListRow | null>(null);
  const [statusModalInitialValue, setStatusModalInitialValue] =
    useState<OrderStatus | null>(null);

  const menuAnchorRef = useRef<HTMLDivElement | null>(null);
  const isMenuFlipped = useAutoFlipDropdown(
    menuAnchorRef,
    Boolean(openMenuId),
    setOpenMenuId,
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchValue, pageSize]);

  const openModal: OpenModal = (type, order, initialStatus) => {
    setSelectedOrder(order);
    // setOpenMenuId(null);
    setStatusModalInitialValue(initialStatus ?? null);
    setActiveModal(type);
  };

  function closeModal() {
    setActiveModal(null);
    setStatusModalInitialValue(null);
    setSelectedOrder(null);
  }

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: [
      "orders",
      refreshTrigger,
      activeTab,
      searchValue,
      page,
      pageSize,
    ],
    queryFn: () =>
      fetchOrders({
        page,
        pageSize,
        search: searchValue,
        status: activeTab,
      }),
    enabled: isSupabaseConfigured,
    placeholderData: (previousData) => previousData,
  });
  const orders = data?.rows ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageCount = data?.pageCount ?? 0;
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = totalCount === 0 ? 0 : startItem + orders.length - 1;

  const columns: ColumnDef<OrderListRow>[] = [
    {
      header: "Order ID",
      cell: (order) => (
        <button className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700">
          {order.shortId}
        </button>
      ),
    },
    {
      header: "Date",
      accessorKey: "date",
      cellClassName: "text-sm text-slate-600",
    },
    {
      header: "Customer",
      cell: (order) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold",
              order.avatarClass,
            )}
          >
            {order.avatar}
          </div>
          <span className="text-sm font-medium text-slate-900">
            {order.customer}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (order) => (
        <span className={getStatusClass(order.status)}>
          {getStatusLabel(order.status)}
        </span>
      ),
    },
    {
      header: "Items",
      accessorKey: "items",
      cellClassName: "text-sm text-slate-600",
    },
    {
      header: "Total",
      accessorKey: "total",
      headerClassName: "text-right",
      cellClassName: "text-right text-sm font-semibold text-slate-900",
    },
    {
      header: "Delivery",
      accessorKey: "delivery",
      cell: (order) => (
        <span className="text-right text-sm font-semibold text-slate-900">
          {order?.delivery?.name}
        </span>
      ),
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (order) => (
        <div
          className="relative inline-block text-left"
          ref={openMenuId === order.id ? menuAnchorRef : null}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId((current) =>
                current === order.id ? null : order.id,
              );
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {openMenuId === order.id && (
            <div
              className={cn(
                "absolute right-0 z-10 w-48 rounded-lg border border-slate-100 bg-white shadow-lg z-50",
                isMenuFlipped ? "bottom-full mb-2" : "top-full mt-2",
              )}
            >
              {/* Group 1: View & Print */}
              <div className="border-b border-slate-100 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal("view", order);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
                <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <Printer className="h-4 w-4" />
                  <span>Print Invoice</span>
                </button>
              </div>

              {/* Group 2: Edit & Update Status */}
              <div className="border-b border-slate-100 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal("edit", order);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Order</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal("update-status", order);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  <span>Update Status</span>
                </button>
              </div>

              {/* Group 3: Cancel & Delete (Danger Actions) */}
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal("update-status", order, "canceled");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel Order</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal("delete", order);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Order</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  const renderOrderCard = (order: OrderListRow) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <button className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700">
            {order.shortId}
          </button>
        </div>
        <span className="text-xs text-slate-500">{order.date}</span>
      </div>

      {/* <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold",
            order.avatarClass,
          )}
        >
          {order.avatar}
        </div>
        <span className="text-sm font-medium text-slate-900">
          {order.customer}
        </span>
      </div> */}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold",
              order.avatarClass,
            )}
          >
            {order.avatar}
          </div>
          <span className="text-sm font-semibold text-slate-900">
            {order.customer}
          </span>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-600 uppercase">{order.items}</div>
          <div className="text-sm font-bold text-slate-900">{order.total}</div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Status
          </span>
          <span className={getStatusClass(order.status)}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          <div
            className="relative inline-block text-left"
            ref={openMenuId === order.id ? menuAnchorRef : null}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId((current) =>
                  current === order.id ? null : order.id,
                );
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {openMenuId === order.id && (
              <div
                className={cn(
                  "absolute right-0 z-10 w-48 rounded-lg border border-slate-100 bg-white shadow-lg",
                  isMenuFlipped ? "bottom-full mb-2" : "top-full mt-2",
                )}
              >
                {/* Group 1: View & Print */}
                <div className="border-b border-slate-100 py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal("view", order);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <Printer className="h-4 w-4" />
                    <span>Print Invoice</span>
                  </button>
                </div>

                {/* Group 2: Edit & Update Status */}
                <div className="border-b border-slate-100 py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal("edit", order);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Order</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal("update-status", order);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    <span>Update Status</span>
                  </button>
                </div>

                {/* Group 3: Cancel & Delete (Danger Actions) */}
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal("update-status", order, "canceled");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Cancel Order</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal("delete", order);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Order</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <ViewOrderModal
        isOpen={activeModal === "view"}
        onClose={closeModal}
        order={selectedOrder}
      />
      <UpdateStatusModal
        isOpen={activeModal === "update-status"}
        onClose={closeModal}
        order={selectedOrder}
        initialStatus={statusModalInitialValue}
      />
      <EditOrderModal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        order={selectedOrder}
      />
      <DeleteOrderModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        order={selectedOrder}
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
          <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Export CSV
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
              data={orders}
              columns={columns}
              isFetching={isFetching}
              hasSelection={true}
              keyExtractor={(order) => order.id}
              // Pagination props
              page={page}
              pageCount={pageCount}
              startItem={startItem}
              endItem={endItem}
              totalCount={totalCount}
              onPageChange={setPage}
              // Empty state
              emptyStateTitle="No orders found"
              emptyStateDescription="New orders from Supabase will appear here."
            />
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden">
            <MobileDataTable
              data={orders}
              isFetching={isFetching}
              page={page}
              pageCount={pageCount}
              startItem={startItem}
              endItem={endItem}
              totalCount={totalCount}
              onPageChange={setPage}
              keyExtractor={(order) => order.id}
              renderRow={renderOrderCard}
              emptyStateTitle="No orders found"
              emptyStateDescription="New orders from Supabase will appear here."
            />
          </div>
        </>
      )}
    </div>
  );
}
