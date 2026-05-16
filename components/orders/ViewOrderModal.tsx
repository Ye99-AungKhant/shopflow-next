"use client";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { CreditCard, MapPin, Package, User } from "lucide-react";
import { Modal } from "../ui/Modal";
import {
  fetchOrderDetails,
  type OrderListRow,
  type OrderStatus,
} from "../../lib/orders";
import Image from "next/image";

type ViewOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  order: OrderListRow | null;
};

function formatCurrency(value: number) {
  return `${value.toFixed(2)}`;
}

function getStatusClass(status: OrderStatus) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "in_delivery":
      return "bg-amber-100 text-amber-700";
    case "canceled":
      return "bg-red-100 text-red-700";
    case "pending":
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getStatusLabel(status: OrderStatus) {
  switch (status) {
    case "in_delivery":
      return "In Delivery";
    case "completed":
      return "Completed";
    case "canceled":
      return "Canceled";
    case "pending":
    default:
      return "Pending";
  }
}

function InfoBlock({
  icon,
  title,
  rows,
}: {
  icon: ReactNode;
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="mb-4 flex items-center gap-2 text-slate-900">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {row.label}
            </p>
            <p className="mt-1 text-sm text-slate-900">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ViewOrderModal({
  isOpen,
  onClose,
  order,
}: ViewOrderModalProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["order-details", order?.id],
    queryFn: () => fetchOrderDetails(order!.id),
    enabled: isOpen && Boolean(order?.id),
  });

  if (!order) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Order Details"
      maxWidthClass="max-w-4xl"
      headerContent={
        <span
          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(order.status)}`}
        >
          {getStatusLabel(order.status)}
        </span>
      }
    >
      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {/* Order Items List */}
            <div className="flex flex-col gap-4">
              {isLoading && (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
                  Loading order items...
                </div>
              )}

              {isError && (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-sm text-rose-500">
                  {error instanceof Error
                    ? error.message
                    : "Failed to load order details."}
                </div>
              )}

              {data?.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Product Image Container */}
                  <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-1">
                    {item?.inventory?.photo_url ? (
                      <Image
                        src={item.inventory?.photo_url}
                        width={100}
                        height={100}
                        alt={item.name}
                        className="h-full w-full object-cover mix-blend-darken"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-1 flex-col py-1">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-800">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        (Quantity: {item.quantity})
                      </p>
                    </div>

                    <div className="mt-auto pt-2">
                      <p className="text-sm font-semibold text-slate-800">
                        Price: MMK {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(data?.totalPrice ?? 0)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">Shipping</span>
                <span className="font-medium text-slate-900">0.00</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-base font-semibold text-slate-900">
                  Total
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(data?.totalPrice ?? 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <InfoBlock
              icon={<User className="h-4 w-4" />}
              title="Customer Information"
              rows={[
                { label: "Name", value: data?.customerName ?? order.customer },
                { label: "Order ID", value: order.shortId },
                { label: "Contact", value: data?.phone || "Not provided" },
              ]}
            />
            <InfoBlock
              icon={<MapPin className="h-4 w-4" />}
              title="Shipping Address"
              rows={[
                { label: "Address", value: data?.address || "Not provided" },
                { label: "Order Date", value: data?.createdAt ?? order.date },
                {
                  label: "Delivery Window",
                  value: `${data?.status ? getStatusLabel(data.status) : getStatusLabel(order.status)}, ${order?.delivery?.name || ""}`,
                },
              ]}
            />
            <InfoBlock
              icon={<CreditCard className="h-4 w-4" />}
              title="Payment Info"
              rows={[
                { label: "Method", value: "Not available in schema" },
                { label: "Payment Status", value: "Captured in order total" },
                {
                  label: "Billing Email",
                  value: data?.email || "Not provided",
                },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-200 p-4">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
