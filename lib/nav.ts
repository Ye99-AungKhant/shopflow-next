import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  PackageSearch,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

export type AppNavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  header: string;
  subheader: string;
  /** Sidebar list only; AI also has a dedicated shortcut button */
  hideOnDesktopNav?: boolean;
};

export const APP_NAV: AppNavItem[] = [
  {
    id: "dashboard",
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    header: "Operations Dashboard",
    subheader: "Monitor revenue, orders, customers, and inventory health.",
  },
  {
    id: "orders",
    href: "/orders",
    label: "Orders",
    icon: ShoppingBag,
    header: "Orders",
    subheader: "Manage, track, and update customer orders.",
  },
  {
    id: "customers",
    href: "/customers",
    label: "Customers",
    icon: Users,
    header: "Customers",
    subheader: "View customers synced from your Supabase customers table.",
  },
  {
    id: "ai",
    href: "/ai",
    label: "AI Order",
    icon: Sparkles,
    header: "AI Order Entry",
    subheader: "Use AI to enter orders.",
    hideOnDesktopNav: true,
  },
  {
    id: "inventory",
    href: "/inventory",
    label: "Inventory",
    icon: PackageSearch,
    header: "Inventory",
    subheader: "Manage product catalog, pricing, and stock levels.",
  },
  {
    id: "settings",
    href: "/settings",
    label: "Settings",
    icon: Settings,
    header: "Settings",
    subheader: "Configure app settings and preferences.",
  },
];

export function getNavMeta(pathname: string): Pick<
  AppNavItem,
  "header" | "subheader"
> {
  const match = APP_NAV.find((item) => item.href === pathname);
  if (match) return { header: match.header, subheader: match.subheader };
  return {
    header: APP_NAV[0].header,
    subheader: APP_NAV[0].subheader,
  };
}
