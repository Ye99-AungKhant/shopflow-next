import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebarProps, navLinkActive } from "./AppSidebar";

// Assuming this is inside your navigation component function
export default function BottomNav({ navItems, pathname }: AppSidebarProps) {
  // ... your existing hooks (like getting pathname) ...
  // const pathname = usePathname();

  // 1. Check if the current route is '/ai' (or any other route you want to hide it on)
  const isHiddenRoute = pathname === "/ai" || pathname.startsWith("/ai/");

  // 2. If it is a hidden route, don't render anything
  if (isHiddenRoute) {
    return null;
  }

  // 3. Otherwise, render your navigation normally
  return (
    <>
      {/* Your Floating Action Button */}
      <Link
        href="/ai"
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 transition-transform hover:-translate-y-1 active:scale-95 md:hidden"
      >
        <Sparkles className="h-6 w-6" />
      </Link>

      {/* Your Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-slate-200/70 bg-white/95 px-2 py-2 pb-3 backdrop-blur-xl md:hidden">
        {navItems
          .filter((item) => item.label !== "AI Order")
          .map((item) => {
            const Icon = item.icon;
            const isActive = navLinkActive(pathname, item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex w-full flex-col items-center gap-1"
              >
                <div
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-all duration-300",
                    isActive
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-transparent text-slate-500",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-indigo-700" : "text-slate-500",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
      </div>
    </>
  );
}
