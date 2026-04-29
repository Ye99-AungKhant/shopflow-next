"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  LayoutDashboard,
  PackageSearch,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { AiOrderEntry } from "../components/AiOrderEntry";
import { Dashboard } from "../components/Dashboard";
import { InventoryList } from "../components/InventoryList";
import { OrderList } from "../components/OrderList";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  header: string;
  subheader: string;
};

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    header: "Operations Dashboard",
    subheader: "Monitor revenue, orders, customers, and inventory health.",
  },
  {
    id: "orders",
    label: "Orders",
    icon: ShoppingBag,
    header: "Orders",
    subheader: "Manage, track, and update customer orders.",
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: PackageSearch,
    header: "Inventory",
    subheader: "Manage product catalog, pricing, and stock levels.",
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<
    | NavItem
    | {
        id: string;
        label: string;
        icon: React.ComponentType<any>;
        header: string;
        subheader: string;
      }
  >(navItems[0]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOrderAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const activateAiTab = () => {
    setActiveTab({
      id: "ai",
      label: "AI Order Entry",
      icon: Sparkles,
      header: "AI Order Entry",
      subheader: "Use AI to enter orders.",
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <AppSidebar
        navItems={navItems}
        activeTabId={activeTab.id}
        onSelect={(item) => setActiveTab(item)}
        onAiSelect={activateAiTab}
      />

      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <AppHeader activeTab={activeTab} onAiSelect={activateAiTab} />

        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {activeTab.id === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <Dashboard refreshTrigger={refreshTrigger} />
              </motion.div>
            )}

            {activeTab.id === "orders" && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <OrderList refreshTrigger={refreshTrigger} />
              </motion.div>
            )}

            {activeTab.id === "inventory" && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <InventoryList />
              </motion.div>
            )}

            {activeTab.id === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <AiOrderEntry onOrderAdded={handleOrderAdded} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
