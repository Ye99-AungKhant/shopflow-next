"use client";

import { Search, Plus, LogOut, User } from "lucide-react";
import { logout } from "@/app/login/actions";
import UserMenu from "./UserMenu";

type HeaderProps = {
  activeTab: {
    header: string;
    subheader: string;
  };
  onAiSelect: () => void;
};

export function AppHeader({ activeTab, onAiSelect }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-slate-50/90 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="hidden md:block">
          <h1 className="text-3xl font-semibold text-gray-900">
            {activeTab.header}
          </h1>
          <p className="text-sm text-slate-500">{activeTab.subheader}</p>
        </div>

        <div className="flex items-center  gap-3 ">
          <label className="relative block min-w-[240px] flex-1 sm:w-72">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders, SKUs, customers..."
              className="h-11 w-full rounded-2xl bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none ring-1 ring-slate-200/70 transition placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>

          <div className="flex items-center gap-3">
            {/* <button
              type="button"
              onClick={onAiSelect}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Quick Add
            </button> */}
            {/* <form action={logout}>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Logout
              </button>
            </form> */}
            {/* <div className="flex items-center gap-3 rounded-2xl bg-white md:px-3 md:py-1 sm:p-0 shadow-sm ring-1 ring-slate-200/70">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white">
                SF
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  Sophie Flow
                </p>
                <p className="text-xs text-slate-500">Admin</p>
              </div>
              <LogOut
                onClick={logout}
                className="text-red-500 hover:text-red-700 cursor-pointer transition-colors"
              />
            </div> */}
            <UserMenu logout={logout} />
          </div>
        </div>
      </div>
    </header>
  );
}
