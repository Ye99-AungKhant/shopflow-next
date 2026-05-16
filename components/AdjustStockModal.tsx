"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "./ui/Modal";

type AdjustmentType = "add" | "subtract" | "set";

type AdjustStockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  currentStock: number;
  onConfirm: (payload: { type: AdjustmentType; amount: number }) => void;
  isSubmitting?: boolean;
};

export function AdjustStockModal({
  isOpen,
  onClose,
  productName = "Product",
  currentStock,
  onConfirm,
  isSubmitting = false,
}: AdjustStockModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("add");
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAdjustmentType("add");
      setQuantity("");
    }
  }, [isOpen]);

  const parsedQuantity = Number(quantity);
  const safeQuantity = Number.isFinite(parsedQuantity)
    ? Math.max(parsedQuantity, 0)
    : 0;

  const previewValue =
    adjustmentType === "add"
      ? currentStock + safeQuantity
      : adjustmentType === "subtract"
        ? Math.max(currentStock - safeQuantity, 0)
        : safeQuantity;

  const previewColor =
    adjustmentType === "add"
      ? "text-emerald-600"
      : adjustmentType === "subtract"
        ? "text-amber-600"
        : "text-slate-900";

  const labelText =
    adjustmentType === "add"
      ? "Quantity to Add"
      : adjustmentType === "subtract"
        ? "Quantity to Subtract"
        : "Exact Stock Quantity";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Stock Level"
      maxWidthClass="max-w-md"
      headerContent={
        <p className="text-sm text-slate-500">
          Update inventory for {productName}.
        </p>
      }
    >
      <div className="space-y-6 p-6">
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
          Current Stock:{" "}
          <span className="font-semibold text-slate-900">{currentStock}</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { id: "add", label: "Add" },
              { id: "subtract", label: "Subtract" },
              { id: "set", label: "Set Exact" },
            ] as const
          ).map((option) => {
            const active = adjustmentType === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setAdjustmentType(option.id)}
                className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border-indigo-500 bg-indigo-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            {labelText}
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className={`font-semibold ${previewColor}`}>
            New Stock Level: {previewValue}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-gray-50 p-4 rounded-b-xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onConfirm({ type: adjustmentType, amount: safeQuantity })
          }
          disabled={isSubmitting || safeQuantity <= 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : null}
          {isSubmitting ? "Applying…" : "Confirm Adjustment"}
        </button>
      </div>
    </Modal>
  );
}
