"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "./ui/Modal";
import { deleteCustomer } from "@/lib/customers";
import type { Customer } from "@/lib/supabase";

type DeleteCustomerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
};

export function DeleteCustomerModal({
  isOpen,
  onClose,
  customer,
}: DeleteCustomerModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setConfirmationText("");
    }
  }, [isOpen, customer]);

  const mutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      onClose();
    },
  });

  if (!customer) {
    return null;
  }

  const isConfirmed = confirmationText === "DELETE";
  const displayName =
    customer.name === "—" ? "this customer" : customer.name;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span>Delete customer</span>
        </span>
      }
      maxWidthClass="max-w-md"
      headerContent={
        <p className="mt-1 text-sm text-slate-500">
          You are deleting <strong>{displayName}</strong>.
        </p>
      }
    >
      <div className="space-y-5 p-6">
        <div className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">
          This cannot be undone. If orders reference this customer, deletion may
          fail until those references are removed.
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Type DELETE to confirm
          </label>
          <input
            type="text"
            value={confirmationText}
            onChange={(ev) => setConfirmationText(ev.target.value)}
            placeholder="DELETE"
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        {mutation.isError && (
          <p className="text-sm text-rose-500">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Failed to delete customer."}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={onClose}
          disabled={mutation.isPending}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            mutation.reset();
            mutation.mutate(customer.id);
          }}
          disabled={!isConfirmed || mutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : null}
          {mutation.isPending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
