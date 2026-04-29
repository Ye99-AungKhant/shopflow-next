"use client";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./ui/Modal";

type DeleteItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  productName?: string;
  isDeleting?: boolean;
};

export function DeleteItemModal({
  isOpen,
  onClose,
  onDelete,
  productName = "this product",
  isDeleting = false,
}: DeleteItemModalProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const isConfirmed = confirmationText.trim().toUpperCase() === "DELETE";

  const handleDelete = () => {
    if (!isConfirmed) {
      return;
    }
    onDelete();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Product"
      maxWidthClass="max-w-md"
      headerContent={
        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          <span>Remove {productName} from the catalog.</span>
        </div>
      }
    >
      <div className="space-y-6 p-6">
        <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
          Warning: This will permanently remove this product from the catalog.
          This action cannot be undone.
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Type DELETE to confirm
          </label>
          <input
            type="text"
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder="DELETE"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-gray-50 p-4 rounded-b-xl">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={!isConfirmed || isDeleting}
          className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Permanently Delete
        </button>
      </div>
    </Modal>
  );
}
