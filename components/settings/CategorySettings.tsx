"use client";

import { useEffect, useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const defaultCategories = ["General", "Food", "Drinks", "Specials"];

export function CategorySettings() {
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => setSuccess(null), 3000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      setError("Category name cannot be empty.");
      return;
    }

    if (categories.includes(trimmed)) {
      setError("That category already exists.");
      return;
    }

    setCategories((current) => [...current, trimmed]);
    setNewCategory("");
    setError(null);
    setSuccess(`Category "${trimmed}" added.`);
  };

  const handleRemoveCategory = (category: string) => {
    setCategories((current) => current.filter((item) => item !== category));
    setSuccess(`Category "${category}" removed.`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Inventory Categories
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Manage product categories used throughout the inventory.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block w-full sm:w-80">
              <span className="sr-only">New category name</span>
              <input
                type="text"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="Add a category"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <button
              type="button"
              onClick={handleAddCategory}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>
        </div>

        {(error || success) && (
          <div
            className={cn(
              "mt-4 rounded-2xl border px-4 py-3 text-sm",
              error
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {error ?? success}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Configured categories
            </p>
            <p className="text-sm text-slate-500">
              These categories can be assigned to inventory items.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {categories.length} total
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category}
              className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                  <Tag className="h-4 w-4" />
                </span>
                <span className="font-medium text-slate-900">{category}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCategory(category)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
