"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { APP_NAV, getNavMeta } from "@/lib/nav";
import { AppHeader } from "./AppHeader";
import { AppSearchProvider } from "./AppSearchContext";
import { AppSidebar } from "./AppSidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const headerCopy = getNavMeta(pathname);

  return (
    <AppSearchProvider>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <AppSidebar navItems={APP_NAV} pathname={pathname} />

        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          <AppHeader
            header={headerCopy.header}
            subheader={headerCopy.subheader}
            pathname={pathname}
          />

          <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6 sm:px-6 lg:px-8">
            <AnimatePresence mode="sync">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </AppSearchProvider>
  );
}
