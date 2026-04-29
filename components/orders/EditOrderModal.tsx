"use client";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import {
  fetchOrderDetails,
  updateOrder,
  type OrderListRow,
} from "../../lib/orders";

type EditOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  order: OrderListRow | null;
};

type EditableItem = {
  id: string;
  inventoryId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  source: string | null;
};

const fieldLabelClass =
  "mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500";
const inputClass =
  "w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500";

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export function EditOrderModal({
  isOpen,
  onClose,
  order,
}: EditOrderModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["order-details", order?.id],
    queryFn: () => fetchOrderDetails(order!.id),
    enabled: isOpen && Boolean(order?.id),
  });

  useEffect(() => {
    if (!data || !isOpen) {
      return;
    }

    setFirstName(data.firstName);
    setLastName(data.lastName);
    setEmail(data.email);
    setPhone(data.phone);
    setShippingAddress(data.address);
    setItems(
      data.items.map((item) => ({
        id: item.id,
        inventoryId: item.inventoryId,
        name: item.name,
        unitPrice: item.price,
        quantity: item.quantity,
        source: item.source,
      })),
    );
    setErrorMessage("");
  }, [isOpen, data]);

  const mutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({
          queryKey: ["order-details", order?.id],
        }),
      ]);
      onClose();
    },
    onError: (mutationError) => {
      setErrorMessage(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to save order changes.",
      );
    },
  });

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );

  if (!order) {
    return null;
  }

  function updateQuantity(id: string, quantity: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
      ),
    );
  }

  function updateName(id: string, name: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, name } : item)),
    );
  }

  function updatePrice(id: string, unitPrice: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, unitPrice: Math.max(0, unitPrice) } : item,
      ),
    );
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        inventoryId: null,
        name: "New Product",
        unitPrice: 10,
        quantity: 1,
        source: "manual",
      },
    ]);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Order ${order.shortId}`}
      maxWidthClass="max-w-4xl"
      headerContent={
        <p className="mt-1 text-sm text-slate-500">
          Modify customer details, shipping address, or order items.
        </p>
      }
    >
      <div className="p-6">
        {isLoading && (
          <p className="text-sm text-slate-500">Loading order details...</p>
        )}
        {isError && (
          <p className="text-sm text-rose-500">
            {error instanceof Error
              ? error.message
              : "Failed to load order details."}
          </p>
        )}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={fieldLabelClass}>First Name</label>
                  <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass}>Last Name</label>
                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={fieldLabelClass}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled
                  className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-400`}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Email is not stored in the current database schema.
                </p>
              </div>

              <div>
                <label className={fieldLabelClass}>Phone Number</label>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={fieldLabelClass}>Shipping Address</label>
                <textarea
                  rows={3}
                  value={shippingAddress}
                  onChange={(event) => setShippingAddress(event.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <p className={fieldLabelClass}>Order Items</p>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-md bg-slate-200" />
                      <div>
                        <input
                          value={item.name}
                          onChange={(event) =>
                            updateName(item.id, event.target.value)
                          }
                          className="w-full border-none bg-transparent p-0 text-sm font-medium text-slate-900 outline-none"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(event) =>
                            updatePrice(
                              item.id,
                              Number(event.target.value) || 0,
                            )
                          }
                          className="mt-1 w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) =>
                            updateQuantity(
                              item.id,
                              Number(event.target.value) || 1,
                            )
                          }
                          className="w-12 border-x border-slate-200 bg-white px-2 py-2 text-center text-sm text-slate-900 outline-none"
                        />
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addItem}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-2 font-medium text-indigo-600 transition hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
              <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-600">
                  Order Total
                </span>
                <span className="text-base font-semibold text-slate-900">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 rounded-b-xl border-t border-slate-100 bg-gray-50 p-4">
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (!data) {
              return;
            }

            setErrorMessage("");
            mutation.mutate({
              orderId: data.id,
              customerId: data.customerId,
              firstName,
              lastName,
              phone,
              address: shippingAddress,
              items: items.map((item) => ({
                id: item.id,
                inventoryId: item.inventoryId,
                name: item.name,
                quantity: item.quantity,
                price: item.unitPrice,
                source: item.source,
              })),
            });
          }}
          disabled={mutation.isPending || isLoading || isError}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
      {errorMessage && (
        <div className="px-6 pb-6 text-sm text-rose-500">{errorMessage}</div>
      )}
    </Modal>
  );
}
