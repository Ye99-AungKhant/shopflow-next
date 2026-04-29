"use client";

import { type ComponentType } from "react";
import { Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";

type NavItem = {
  id: string;
  label: string;
  icon: ComponentType<any>;
  header: string;
  subheader: string;
};

interface AppSidebarProps {
  navItems: NavItem[];
  activeTabId: string;
  onSelect: (item: NavItem) => void;
  onAiSelect: () => void;
}

export function AppSidebar({
  navItems,
  activeTabId,
  onSelect,
  onAiSelect,
}: AppSidebarProps) {
  return (
    <>
      <aside className="hidden md:flex md:w-64 md:flex-col md:bg-white md:px-4 md:py-5 md:shadow-[0_20px_60px_-30px_rgba(15,23,42,0.18)]">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 shadow-sm shadow-indigo-200/80">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-slate-900">
              ShopFlow
            </p>
            <p className="text-xs text-slate-500">Order operations hub</p>
          </div>
        </div>

        <nav className="mt-10 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTabId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={onAiSelect}
            className={cn(
              "mt-3 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition shadow-sm",
              activeTabId === "ai"
                ? "bg-gradient-to-r from-fuchsia-100 via-violet-100 to-indigo-100 text-violet-700"
                : "bg-gradient-to-r from-fuchsia-50 via-violet-50 to-indigo-50 text-violet-700 hover:from-fuchsia-100 hover:via-violet-100 hover:to-indigo-100",
            )}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Order Entry</span>
          </button>
        </nav>

        <div className="mt-auto flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                isSupabaseConfigured ? "bg-emerald-500" : "bg-rose-500",
              )}
            />
            <span>
              {isSupabaseConfigured ? "Supabase Connected" : "Setup Required"}
            </span>
          </div>
          <Settings className="h-4 w-4" />
        </div>
      </aside>

      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200/70 bg-white/90 px-2 py-2 backdrop-blur-xl md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTabId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={cn(
                "flex min-w-[72px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium transition",
                isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-500",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
