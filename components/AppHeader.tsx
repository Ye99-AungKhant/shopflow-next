"use client";

import { Search } from "lucide-react";
import { logout } from "@/app/login/actions";
import UserMenu from "./UserMenu";
import { headerSearchActivePath, useAppSearch } from "./AppSearchContext";
import Image from "next/image";

type HeaderProps = {
  header: string;
  subheader: string;
  pathname: string;
};

export function AppHeader({ header, subheader, pathname }: HeaderProps) {
  const showSearch = headerSearchActivePath(pathname);
  const { searchQuery, setSearchQuery } = useAppSearch();

  const placeholder =
    pathname === "/inventory"
      ? "Search products, SKUs..."
      : pathname === "/customers"
        ? "Search customers by name, phone, address..."
        : "Search orders, customers...";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-slate-50/90 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="hidden md:block">
          <h1 className="text-3xl font-semibold text-gray-900">{header}</h1>
          <p className="text-sm text-slate-500">{subheader}</p>
        </div>

        <div className="flex justify-between gap-3 lg:ml-auto">
          {showSearch ? (
            <label className="relative block min-w-[240px] flex-1 sm:w-72">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                autoComplete="off"
                aria-label={placeholder}
                className="h-11 w-full rounded-2xl bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none ring-1 ring-slate-200/70 transition placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30"
              />
            </label>
          ) : (
            <div className="flex items-center gap-1">
              <Image
                src="/logo.png"
                alt="ShopFlow"
                width={50}
                height={50}
                className="rounded-sm object-cover"
              />
              <div>
                <p className="text-lg font-bold tracking-tight text-slate-900">
                  ShopFlow
                </p>
                <p className="text-xs text-slate-500">Order operations hub</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <UserMenu logout={logout} />
          </div>
        </div>
      </div>
    </header>
  );
}
