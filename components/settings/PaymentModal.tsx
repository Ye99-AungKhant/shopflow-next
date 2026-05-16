"use client";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Payment } from "@/lib/supabase";
import { createPayment, updatePayment } from "@/lib/payment";

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null; // null for create, existing for edit
};

const fieldLabelClass =
  "mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500";
const inputClass =
  "w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500";

export function PaymentModal({ isOpen, onClose, payment }: PaymentModalProps) {
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const queryClient = useQueryClient();

  const isEdit = Boolean(payment);

  useEffect(() => {
    if (isOpen) {
      if (payment) {
        // Edit mode: populate fields
        setName(payment.name);
        setAccountNumber(payment.account_number || "");
        setEnabled(payment.enabled);
      } else {
        // Create mode: reset fields
        setName("");
        setAccountNumber("");
        setEnabled(true);
      }
      setErrorMessage("");
    }
  }, [isOpen, payment]);

  const createMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      onClose();
    },
    onError: (mutationError) => {
      setErrorMessage(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to create payment.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updatePayment(id, updates),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      onClose();
    },
    onError: (mutationError) => {
      setErrorMessage(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to update payment.",
      );
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      setErrorMessage("Name is required.");
      return;
    }

    setErrorMessage("");

    if (isEdit && payment) {
      updateMutation.mutate({
        id: payment.id,
        updates: {
          name: name.trim(),
          account_number: accountNumber.trim() || null,
          enabled,
        },
      });
    } else {
      createMutation.mutate({
        name: name.trim(),
        account_number: accountNumber.trim() || null,
        enabled,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Payment Method" : "Create Payment Method"}
      maxWidthClass="max-w-md"
      headerContent={
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? "Update payment method information."
            : "Add a new payment method option."}
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
              placeholder="Enter method name"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={fieldLabelClass}>Account No.</label>
            <textarea
              rows={3}
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              placeholder="Enter account No."
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
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : null}
          {isPending
            ? "Saving..."
            : isEdit
              ? "Update Payment"
              : "Create Payment"}
        </button>
      </div>
      {errorMessage && (
        <div className="px-6 pb-6 text-sm text-rose-500">{errorMessage}</div>
      )}
    </Modal>
  );
}
