"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ImagePlus, Plus } from "lucide-react";
import { Modal } from "./ui/Modal";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { removeOldFile } from "@/lib/utils";

type EditItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: {
    name: string;
    sku: string;
    price: number;
    cost: number;
    stock_quantity: number;
    photo_url?: string;
  }) => void;
  isSubmitting?: boolean;
  initialData: {
    id: string;
    name: string;
    sku: string;
    price: number;
    cost: number;
    stock_quantity: number;
    photo_url?: string;
  };
};

export function EditItemModal({
  isOpen,
  onClose,
  onSave,
  isSubmitting = false,
  initialData,
}: EditItemModalProps) {
  const [name, setName] = useState(initialData.name);
  const [sku, setSku] = useState(initialData.sku);
  const [price, setPrice] = useState(initialData.price.toFixed(2));
  const [cost, setCost] = useState(initialData.cost?.toFixed(2) ?? "0.00");
  const [stockQuantity, setStockQuantity] = useState(
    initialData.stock_quantity.toString(),
  );
  const [fileURL, setFileURL] = useState(initialData.photo_url);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialData.name);
      setSku(initialData.sku);
      setPrice(initialData.price.toFixed(2));
      setCost(initialData.cost?.toFixed(2) ?? "0.00");
      setStockQuantity(initialData.stock_quantity.toString());
      setFileURL(initialData.photo_url);
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    setName("");
    setSku("");
    setPrice("");
    setCost("");
    setStockQuantity("");
    setFile(null);
    setFileURL("");
    onClose();
  };

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
    onSave({
      name: name.trim(),
      sku: sku.trim(),
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      stock_quantity: Number(stockQuantity) || 0,
      photo_url: photo_url || fileURL,
    });

    if (fileURL) removeOldFile(fileURL);
    handleClose();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Product"
      maxWidthClass="max-w-lg"
      headerContent={
        <p className="text-sm text-slate-500">
          Enter the product details and initial stock level.
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div
          className="group relative flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center text-slate-500 transition hover:border-indigo-400 hover:bg-slate-100"
          onClick={openFileDialog}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => event.preventDefault()}
        >
          {file || fileURL ? (
            <>
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  setFile(null);

                  //remove existing image preview
                  if (fileURL) {
                    await removeOldFile(fileURL, initialData.id);
                    setFileURL("");
                  }
                }}
                className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-500"
              >
                ✕
              </button>

              <Image
                src={file ? URL.createObjectURL(file) : (fileURL ?? "")}
                alt="Preview"
                width={100}
                height={100}
                className="rounded-xl object-cover"
              />
            </>
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
              Code
            </span>
            <input
              type="text"
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="e.g., T-001"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-150 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Price (MMK)
            </span>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-150 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cost (MMK)
            </span>
            <input
              type="number"
              step="0.01"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-150 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
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
            onClick={handleClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {/* <Plus className="mr-2 h-4 w-4" /> */}
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
