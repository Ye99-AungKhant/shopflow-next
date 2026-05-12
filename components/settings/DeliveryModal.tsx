"use client";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "../ui/Modal";
import {
  createDelivery,
  updateDelivery,
  type Delivery,
} from "../../lib/delivery";

type DeliveryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null; // null for create, existing for edit
};

const fieldLabelClass =
  "mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500";
const inputClass =
  "w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500";

export function DeliveryModal({
  isOpen,
  onClose,
  delivery,
}: DeliveryModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const queryClient = useQueryClient();

  const isEdit = Boolean(delivery);

  useEffect(() => {
    if (isOpen) {
      if (delivery) {
        // Edit mode: populate fields
        setName(delivery.name);
        setPhone(delivery.phone);
        setAddress(delivery.address || "");
        setEnabled(delivery.enabled);
      } else {
        // Create mode: reset fields
        setName("");
        setPhone("");
        setAddress("");
        setEnabled(true);
      }
      setErrorMessage("");
    }
  }, [isOpen, delivery]);

  const createMutation = useMutation({
    mutationFn: createDelivery,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      onClose();
    },
    onError: (mutationError) => {
      setErrorMessage(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to create delivery.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateDelivery(id, updates),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      onClose();
    },
    onError: (mutationError) => {
      setErrorMessage(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to update delivery.",
      );
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      setErrorMessage("Name is required.");
      return;
    }
    if (!phone.trim()) {
      setErrorMessage("Phone is required.");
      return;
    }

    setErrorMessage("");

    if (isEdit && delivery) {
      updateMutation.mutate({
        id: delivery.id,
        updates: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim() || null,
          enabled,
        },
      });
    } else {
      createMutation.mutate({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        enabled,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Delivery" : "Create Delivery"}
      maxWidthClass="max-w-md"
      headerContent={
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? "Update delivery information."
            : "Add a new delivery option."}
        </p>
      }
    >
      <div className="p-6">
        <div className="space-y-5">
          <div>
            <label className={fieldLabelClass}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter delivery name"
              className={inputClass}
            />
          </div>

          <div>
            <label className={fieldLabelClass}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter phone number"
              className={inputClass}
            />
          </div>

          <div>
            <label className={fieldLabelClass}>Address</label>
            <textarea
              rows={3}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Enter delivery address (optional)"
              className={inputClass}
            />
          </div>

          <div>
            <label className={fieldLabelClass}>Status</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEnabled(!enabled)}
                className={`
                  relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full 
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
                  ${enabled ? "bg-indigo-600" : "bg-slate-200"}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
                    transition duration-200 ease-in-out
                    ${enabled ? "translate-x-6" : "translate-x-1"}
                  `}
                />
              </button>
              <span className="text-sm font-medium text-slate-700">
                {enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 rounded-b-xl border-t border-slate-100 bg-gray-50 p-4">
        <button
          onClick={onClose}
          disabled={isPending}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending
            ? "Saving..."
            : isEdit
              ? "Update Delivery"
              : "Create Delivery"}
        </button>
      </div>
      {errorMessage && (
        <div className="px-6 pb-6 text-sm text-rose-500">{errorMessage}</div>
      )}
    </Modal>
  );
}
