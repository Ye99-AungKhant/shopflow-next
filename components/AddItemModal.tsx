"use client";
import { FormEvent, useRef, useState } from "react";
import { ImagePlus, Plus } from "lucide-react";
import { Modal } from "./ui/Modal";
import { supabase } from "../lib/supabase";

type AddItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: {
    name: string;
    sku: string;
    price: number;
    cost: number;
    stock_quantity: number;
    photo_url?: string;
  }) => void;
  isSubmitting?: boolean;
};

export function AddItemModal({
  isOpen,
  onClose,
  onAdd,
  isSubmitting = false,
}: AddItemModalProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let photo_url: string | undefined = undefined;
    if (file) {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);
      setUploading(false);
      if (error) {
        alert("Image upload failed: " + error.message);
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);
      photo_url = publicUrlData?.publicUrl;
    }
    onAdd({
      name: name.trim(),
      sku: sku.trim(),
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      stock_quantity: Number(stockQuantity) || 0,
      photo_url,
    });
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Product"
      maxWidthClass="max-w-lg"
      headerContent={
        <p className="text-sm text-slate-500">
          Enter the product details and initial stock level.
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div
          className="group flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center text-slate-500 transition hover:border-indigo-400 hover:bg-slate-100"
          onClick={openFileDialog}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => event.preventDefault()}
        >
          {file ? (
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="h-20 w-20 rounded-xl object-cover"
            />
          ) : (
            <ImagePlus className="h-9 w-9 text-slate-400 transition group-hover:text-indigo-500" />
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-slate-500">
              SVG, PNG, JPG or GIF (max. 800x400px)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/svg+xml"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <label className="col-span-2 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Product Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Wireless Earbuds"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-150 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              SKU
            </span>
            <input
              type="text"
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="e.g., TECH-001"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-150 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Price
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pl-10 text-sm text-slate-900 outline-none transition-all duration-150 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cost
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pl-10 text-sm text-slate-900 outline-none transition-all duration-150 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Initial Stock
            </span>
            <input
              type="number"
              value={stockQuantity}
              onChange={(event) => setStockQuantity(event.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-150 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>

        <div className="mt-6 border-t border-slate-100 bg-gray-50 p-4 flex justify-end gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Plus className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Add Product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
