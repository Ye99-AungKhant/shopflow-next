"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";
import { cleanString, getCookie } from "@/lib/utils";

export default function UserMenu({ logout }: { logout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [userName, setUserName] = useState<string | undefined>();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserName(getCookie("full_name"));
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    startTransition(() => {
      void logout();
    });
  };

  return (
    <div className="relative" ref={menuRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center gap-3 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50 sm:cursor-default sm:rounded-2xl sm:px-3 sm:py-1 sm:hover:bg-white"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white shadow-inner">
          {cleanString(userName) || "Admin"}
        </div>

        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold text-slate-900">
            {cleanString(userName) || "Admin"}
          </p>
          <p className="text-xs text-slate-500">Admin</p>
        </div>

        <span className="hidden h-9 w-9 shrink-0 items-center justify-center sm:inline-flex">
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin text-red-500" />
          ) : (
            <LogOut
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              className="h-5 w-5 cursor-pointer text-red-500 transition-colors hover:text-red-700"
            />
          )}
        </span>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/50 sm:hidden">
          <div className="mb-3 border-b border-slate-100 pb-3 text-left">
            <p className="text-sm font-bold text-slate-900">
              {cleanString(userName) || "Admin"}
            </p>
            <p className="text-xs font-medium text-slate-500">Admin</p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
