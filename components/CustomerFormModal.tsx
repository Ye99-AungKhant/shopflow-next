"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Customer } from "@/lib/supabase";
import type { CustomerUpsertInput } from "@/lib/customers";
import { Loader2 } from "lucide-react";
import { Modal } from "./ui/Modal";

type CustomerFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** `null` = create new customer */
  customer: Customer | null;
  onSave: (values: CustomerUpsertInput) => void | Promise<void>;
  isSubmitting?: boolean;
  serverError?: string | null;
};

export function CustomerFormModal({
  isOpen,
  onClose,
  customer,
  onSave,
  isSubmitting = false,
  serverError = null,
}: CustomerFormModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const isEdit = Boolean(customer);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setLocalError(null);
    if (customer) {
      setName(customer.name === "—" ? "" : customer.name);
      setPhone(customer.phone ?? "");
      setAddress(customer.address ?? "");
    } else {
      setName("");
      setPhone("");
      setAddress("");
    }
  }, [isOpen, customer]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError("Name is required.");
      return;
    }
    setLocalError(null);
    try {
      await onSave({
        name: trimmedName,
        phone: phone.trim(),
        address: address.trim(),
      });
    } catch {
      // Supabase / network errors surface via serverError
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit customer" : "Add customer"}
      maxWidthClass="max-w-lg"
      headerContent={
        <p className="text-sm text-slate-500">
          {isEdit
            ? "Update name, phone, and address."
            : "Create a customer record in Supabase."}
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="space-y-4 p-6">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Name <span className="text-rose-500">*</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              placeholder="Customer name"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Phone
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(ev) => setPhone(ev.target.value)}
              placeholder="Phone number"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Address
            </span>
            <textarea
              value={address}
              onChange={(ev) => setAddress(ev.target.value)}
              placeholder="Street, city…"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
          {localError && (
            <p className="text-sm text-rose-600">{localError}</p>
          )}
          {serverError && (
            <p className="text-sm text-rose-600">{serverError}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : null}
            {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
