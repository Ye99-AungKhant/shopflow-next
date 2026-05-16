"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRightLeft,
  Check,
  Copy,
  CreditCard,
  Download,
  Edit,
  Eye,
  Loader2,
  MapPin,
  MoreHorizontal,
  Package,
  Phone,
  Plus,
  Printer,
  Search,
  Trash2,
  Truck,
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
import { Delivery, isSupabaseConfigured, Payment } from "../lib/supabase";
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
import { DeliveryModal } from "./settings/DeliveryModal";
import { paymentMethodColumns } from "./settings/PaymentMethodColumn";
import {
  useGetPayments,
  useUpdatePaymentStatusMutation,
} from "@/hooks/payment";
import { PaymentModal } from "./settings/PaymentModal";

type FilterTab = string;
const pageSizeOptions = [10, 50, 100] as const;
type ActiveModal =
  | "view"
  | "edit"
  | "update-status"
  | "delete"
  | "create-delivery"
  | "edit-delivery"
  | "create-payment"
  | "edit-payment"
  | null;

export type OpenModal = (
  type: ActiveModal,
  order: OrderListRow,
  initialStatus?: OrderStatus | null,
) => void;

const tabs: { id: FilterTab; label: string }[] = [
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment Method" },
];

export function SettingList() {
  const [activeTab, setActiveTab] = useState<FilterTab>("delivery");
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
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuAnchorRef = useRef<HTMLDivElement | null>(null);
  const isMenuFlipped = useAutoFlipDropdown(
    menuAnchorRef,
    Boolean(openMenuId),
    setOpenMenuId,
  );
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const {
    mutate: paymentMutate,
    isPending: paymentPending,
    variables: paymentToggleVars,
  } = useUpdatePaymentStatusMutation();

  const updateDeliveryStatusMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateDelivery(id, { enabled }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
  });

  const isDeliveryTogglePending = (id: string) =>
    updateDeliveryStatusMutation.isPending &&
    updateDeliveryStatusMutation.variables?.id === id;

  const isPaymentTogglePending = (id: string) =>
    paymentPending && paymentToggleVars?.id === id;

  useEffect(() => {
    setPage(1);
  }, [activeTab, pageSize]);

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
    type:
      | "create-delivery"
      | "edit-delivery"
      | "create-payment"
      | "edit-payment",
    editData?: Delivery | Payment,
  ) => {
    if (activeTab === "delivery") {
      setSelectedDelivery((editData as Delivery) || null);
    } else {
      setSelectedPayment((editData as Payment) || null);
    }
    setActiveModal(type);
  };

  function closeModal() {
    setActiveModal(null);
    setStatusModalInitialValue(null);
    setSelectedOrder(null);
    setSelectedDelivery(null);
  }

  const statusFilter = activeTab as OrderStatus | "all";

  const {
    data: deliveries,
    isLoading: isLoadingDelivery,
    isFetched: isFetchedDelivery,
    isError,
    error,
  } = useGetDeliveries();

  const {
    data: payments,
    isLoading: isLoadingPayment,
    isFetched: isFetchedPayment,
    isError: isPaymentError,
    error: paymentError,
  } = useGetPayments();

  const handleToggle = async (enableData: Delivery | Payment) => {
    const newState = !enableData.enabled;
    if (activeTab === "delivery") {
      updateDeliveryStatusMutation.mutate({
        id: enableData.id,
        enabled: newState,
      });
    } else {
      paymentMutate({
        id: enableData.id,
        enabled: newState,
      });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    // Reset the icon back to "Copy" after 2 seconds
    setTimeout(() => setCopied(false), 2000);
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
              type="button"
              disabled={isDeliveryTogglePending(deli.id)}
              onClick={() => handleToggle(deli)}
              className={cn(
                `relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70`,
                deli.enabled ? "bg-indigo-600" : "bg-slate-200",
              )}
            >
              {isDeliveryTogglePending(deli.id) ? (
                <Loader2
                  className={cn(
                    "absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin",
                    deli.enabled ? "text-white" : "text-indigo-600",
                  )}
                />
              ) : (
                <span
                  className={`
              pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${deli.enabled ? "translate-x-6" : "translate-x-1"}
            `}
                />
              )}
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

  const paymentColumns: ColumnDef<Payment>[] = [
    {
      header: "Name",
      cell: (payment) => (
        <button className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700">
          {payment.name}
        </button>
      ),
    },
    {
      header: "Name",
      cell: (payment) => (
        <span className="text-sm text-slate-600">{payment.name ?? "-"}</span>
      ),
    },
    {
      header: "Account No.",
      cell: (payment) => (
        <span className="text-sm text-slate-600">
          {payment.account_number ?? "-"}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (payment) => {
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isPaymentTogglePending(payment.id)}
              onClick={() => handleToggle(payment)}
              className={cn(
                `relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70`,
                payment.enabled ? "bg-indigo-600" : "bg-slate-200",
              )}
            >
              {isPaymentTogglePending(payment.id) ? (
                <Loader2
                  className={cn(
                    "absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin",
                    payment.enabled ? "text-white" : "text-indigo-600",
                  )}
                />
              ) : (
                <span
                  className={`
                  pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
                  transition duration-200 ease-in-out
                  ${payment.enabled ? "translate-x-6" : "translate-x-1"}
                `}
                />
              )}
            </button>
            <span className="text-sm font-medium text-slate-700">
              {payment.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (payment) => (
        <button
          // Assuming you have a payment modal rather than delivery here
          onClick={() => openDeliveryModal("edit-payment", payment)}
          className="text-sm text-slate-700 hover:bg-slate-50 p-1 rounded"
        >
          <Edit className="h-4 w-4" />
        </button>
      ),
    },
  ];

  const renderOrderCard = (deli: Delivery) => (
    <div className="max-w-md mx-auto space-y-3">
      {/* Card List Item */}
      <div
        key={deli.id}
        className="group relative flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5"
      >
        {/* Left Side: Icon & Provider Info */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Brand Icon Box */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
            <Truck className="h-6 w-6" />
          </div>

          {/* Text Content */}
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate transition-colors group-hover:text-indigo-600">
              {deli.name}
            </h3>

            {/* Compact Details (Conditional) */}
            <div className="flex flex-col gap-0.5 mt-0.5">
              {deli.phone && (
                <div className="group/phone flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <Phone className="h-3 w-3" />
                  <span>{deli.phone}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering any card-level clicks
                      handleCopy(deli.phone);
                    }}
                    className="ml-1 flex items-center opacity-0 transition-all group-hover/phone:opacity-100 hover:text-indigo-600"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
              {deli.address && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{deli.address}</span>
                </div>
              )}
              {!deli.phone && !deli.address && (
                <span className="text-[11px] italic text-slate-300">
                  No contact info
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Status Toggle & Edit Action */}
        <div className="flex flex-col items-center gap-2 shrink-0 ml-4">
          {/* Edit Action Button */}
          <button
            onClick={() => openDeliveryModal("edit-delivery", deli)}
            className="rounded-full text-slate-400 transition-colors hover:bg-slate-50 hover:text-indigo-600"
          >
            <Edit className="h-4 w-4" />
          </button>

          {/* Subtle horizon Divider */}
          <div className="h-px w-8 bg-slate-100" />

          {/* Status Toggle Group */}

          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              disabled={isDeliveryTogglePending(deli.id)}
              onClick={() => handleToggle(deli)}
              className={cn(
                `relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70`,
                deli.enabled ? "bg-indigo-600" : "bg-slate-200",
              )}
            >
              {isDeliveryTogglePending(deli.id) ? (
                <Loader2
                  className={cn(
                    "absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 animate-spin",
                    deli.enabled ? "text-white" : "text-indigo-600",
                  )}
                />
              ) : (
                <span
                  className={`
              pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${deli.enabled ? "translate-x-6" : "translate-x-1"}
            `}
                />
              )}
            </button>
            <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">
              {deli.enabled ? "Active" : "Disable"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentCard = (payment: Payment) => (
    <div
      key={payment.id}
      className="group relative flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5"
    >
      {/* Left Side: Brand Icon & Info */}
      <div className="flex items-center gap-4">
        {/* Dynamic Icon Box */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
          <CreditCard className="h-6 w-6" />
        </div>

        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
            {payment.name}
          </h3>
          {payment.account_number && (
            <span className="text-xs font-medium tracking-wider text-slate-500">
              {payment.account_number}
            </span>
          )}
        </div>
      </div>

      {/* Right Side: Status Toggle & Actions */}
      <div className="flex flex-col items-center gap-2">
        {/* Edit Action */}
        <button
          onClick={() => openDeliveryModal("edit-payment", payment)}
          className="rounded-full text-slate-400 transition-colors hover:bg-slate-50 hover:text-indigo-600"
        >
          <Edit className="h-4 w-4" />
        </button>

        {/* Vertical Divider */}
        <div className="h-px w-8 bg-slate-100" />

        {/* Status Toggle Group */}
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            disabled={isPaymentTogglePending(payment.id)}
            onClick={() => handleToggle(payment)}
            className={cn(
              `relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70`,
              payment.enabled ? "bg-indigo-600" : "bg-slate-200",
            )}
          >
            {isPaymentTogglePending(payment.id) ? (
              <Loader2
                className={cn(
                  "absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 animate-spin",
                  payment.enabled ? "text-white" : "text-indigo-600",
                )}
              />
            ) : (
              <span
                className={`
            pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${payment.enabled ? "translate-x-6" : "translate-x-1"}
          `}
              />
            )}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">
            {payment.enabled ? "Active" : "Disable"}
          </span>
        </div>
      </div>
    </div>
  );

  const handleAddNew = () => {
    if (activeTab === "delivery") {
      openDeliveryModal("create-delivery");
    } else {
      openDeliveryModal("create-payment");
    }
  };

  const tableConfig = useMemo(() => {
    switch (activeTab) {
      case "delivery":
        return {
          data: deliveries || [],
          columns: deliColumns,
          isFetching: isFetchedDelivery, // Use delivery fetching state
          emptyTitle: "No deliveries found",
          emptyDesc: "New deliveries from Supabase will appear here.",
        };
      case "payment":
        return {
          data: payments || [],
          columns: paymentColumns, // Your fixed payment columns
          isFetching: isFetchedPayment, // Use payment fetching state
          emptyTitle: "No payment methods found",
          emptyDesc: "New payment methods from Supabase will appear here.",
        };
      default:
        return {
          data: [],
          columns: [],
          isFetching: false,
          emptyTitle: "No data found",
          emptyDesc: "",
        };
    }
  }, [activeTab, deliveries, payments, isFetchedDelivery, isFetchedPayment]);

  return (
    <div className="space-y-6">
      <DeliveryModal
        isOpen={
          activeModal === "create-delivery" || activeModal === "edit-delivery"
        }
        onClose={closeModal}
        delivery={selectedDelivery}
      />
      <PaymentModal
        isOpen={
          activeModal === "create-payment" || activeModal === "edit-payment"
        }
        onClose={closeModal}
        payment={selectedPayment}
      />

      <div className="flex flex-row justify-between gap-2">
        <div className="flex gap-2">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="bg-transparent font-medium text-slate-900 outline-none"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

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
        </div>
        <button
          type="button"
          onClick={handleAddNew}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm">
          Please configure your Supabase URL and Anon Key in the environment
          variables to load orders.
        </div>
      )}

      {isSupabaseConfigured && isLoadingDelivery && (
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

      {isSupabaseConfigured && !isLoadingDelivery && !isError && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataTable
              // Dynamic Props
              data={tableConfig.data as any[]}
              columns={tableConfig.columns as any}
              isFetching={tableConfig.isFetching}
              emptyStateTitle={tableConfig.emptyTitle}
              emptyStateDescription={tableConfig.emptyDesc}
              // Static / Generic Props
              hasSelection={true}
              keyExtractor={(item) => item.id}
              page={1}
              pageCount={1}
              startItem={1}
              endItem={tableConfig.data.length}
              totalCount={tableConfig.data.length}
              onPageChange={() => {}}
            />
          </div>

          <div className="block md:hidden">
            {activeTab === "delivery" ? (
              <MobileDataTable
                data={deliveries || []}
                isFetching={isFetchedDelivery}
                page={page}
                pageCount={1}
                startItem={1}
                endItem={tableConfig.data.length}
                totalCount={tableConfig.data.length}
                onPageChange={setPage}
                keyExtractor={(deli) => deli.id}
                renderRow={renderOrderCard}
                emptyStateTitle="No deliveries found"
                emptyStateDescription="New orders from Supabase will appear here."
              />
            ) : (
              <MobileDataTable
                data={payments || []}
                isFetching={isFetchedPayment}
                page={page}
                pageCount={1}
                startItem={1}
                endItem={tableConfig.data.length}
                totalCount={tableConfig.data.length}
                onPageChange={setPage}
                keyExtractor={(deli) => deli.id}
                renderRow={renderPaymentCard}
                emptyStateTitle="No payments found"
                emptyStateDescription="New orders from Supabase will appear here."
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
