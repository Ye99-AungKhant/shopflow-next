import { subDays, format } from "date-fns";
import {
  isSupabaseConfigured,
  supabase,
  type Customer,
  type InventoryItem,
  type Order,
} from "./supabase";

type OrderWithRelations = Order & {
  customer: Customer | null;
  order_items: {
    id: string;
    order_id: string;
    inventory_id: string | null;
    name: string;
    quantity: number;
    price: number;
    source: string;
    created_at: string;
  }[];
};

export type DashboardRevenuePoint = {
  day: string;
  revenue: number;
};

export type DashboardCustomer = {
  name: string;
  ltv: string;
  avatar: string;
  color: string;
};

export type DashboardProduct = {
  name: string;
  sold: string;
  revenue: string;
};

export type DashboardTrend = {
  value: number;
  direction: "up" | "down" | "flat";
  label: string;
};

export type DashboardData = {
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  totalCustomers: number;
  completedOrders: number;
  trends: {
    revenue: DashboardTrend;
    orders: DashboardTrend;
    customers: DashboardTrend;
    completed: DashboardTrend;
  };
  revenueData: DashboardRevenuePoint[];
  topCustomers: DashboardCustomer[];
  popularProducts: DashboardProduct[];
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
  };
};

const customerColors = [
  "bg-rose-100 text-rose-600",
  "bg-sky-100 text-sky-600",
  "bg-violet-100 text-violet-600",
  "bg-emerald-100 text-emerald-600",
];

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function buildTrend(current: number, previous: number): DashboardTrend {
  if (current === 0 && previous === 0) {
    return {
      value: 0,
      direction: "flat",
      label: "0% vs last week",
    };
  }

  if (previous === 0) {
    return {
      value: 100,
      direction: "up",
      label: "+100% vs last week",
    };
  }

  const rawChange = ((current - previous) / previous) * 100;
  const rounded = Math.round(rawChange);

  if (rounded === 0) {
    return {
      value: 0,
      direction: "flat",
      label: "0% vs last week",
    };
  }

  return {
    value: Math.abs(rounded),
    direction: rounded > 0 ? "up" : "down",
    label: `${rounded > 0 ? "+" : ""}${rounded}% vs last week`,
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function fetchDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured) {
    return {
      totalCost: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalOrders: 0,
      totalCustomers: 0,
      completedOrders: 0,
      trends: {
        revenue: buildTrend(0, 0),
        orders: buildTrend(0, 0),
        customers: buildTrend(0, 0),
        completed: buildTrend(0, 0),
      },
      revenueData: [],
      topCustomers: [],
      popularProducts: [],
      inventory: {
        totalProducts: 0,
        lowStock: 0,
        outOfStock: 0,
      },
    };
  }

  const [ordersResult, customersResult, inventoryResult] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `
          id,
          customer_id,
          status,
          total_price,
          created_at,
          customer:customers(id, name, phone, address, created_at),
          order_items(id, order_id, inventory_id, name, quantity, price, source, created_at)
        `,
      )
      .order("created_at", { ascending: false }),
    supabase.from("customers").select("id, name, phone, address, created_at"),
    supabase
      .from("inventory")
      .select("id, name, sku, stock_quantity, cost, price, created_at"),
  ]);

  if (ordersResult.error) {
    throw new Error(ordersResult.error.message);
  }

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  if (inventoryResult.error) {
    throw new Error(inventoryResult.error.message);
  }

  const orders = (ordersResult.data ?? []) as OrderWithRelations[];
  const customers = (customersResult.data ?? []) as Customer[];
  const inventory = (inventoryResult.data ?? []) as InventoryItem[];

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.total_price ?? 0),
    0,
  );

  const completedOrders = orders.filter(
    (order) => order.status === "completed",
  ).length;
  const now = new Date();
  const currentPeriodStart = subDays(now, 6);
  const previousPeriodStart = subDays(now, 13);

  const currentOrders = orders.filter(
    (order) => new Date(order.created_at) >= currentPeriodStart,
  );
  const previousOrders = orders.filter((order) => {
    const createdAt = new Date(order.created_at);
    return createdAt >= previousPeriodStart && createdAt < currentPeriodStart;
  });

  const currentCustomers = customers.filter(
    (customer) => new Date(customer.created_at) >= currentPeriodStart,
  );
  const previousCustomers = customers.filter((customer) => {
    const createdAt = new Date(customer.created_at);
    return createdAt >= previousPeriodStart && createdAt < currentPeriodStart;
  });

  const currentRevenue = currentOrders.reduce(
    (sum, order) => sum + Number(order.total_price ?? 0),
    0,
  );
  const previousRevenue = previousOrders.reduce(
    (sum, order) => sum + Number(order.total_price ?? 0),
    0,
  );
  const currentCompleted = currentOrders.filter(
    (order) => order.status === "completed",
  ).length;
  const previousCompleted = previousOrders.filter(
    (order) => order.status === "completed",
  ).length;

  const revenueLookup = new Map<string, number>();
  for (let index = 6; index >= 0; index -= 1) {
    const date = subDays(now, index);
    revenueLookup.set(format(date, "yyyy-MM-dd"), 0);
  }

  for (const order of orders) {
    const key = format(new Date(order.created_at), "yyyy-MM-dd");
    if (revenueLookup.has(key)) {
      revenueLookup.set(
        key,
        (revenueLookup.get(key) ?? 0) + Number(order.total_price ?? 0),
      );
    }
  }

  const revenueData = Array.from(revenueLookup.entries()).map(
    ([date, revenue]) => ({
      day: format(new Date(date), "EEE"),
      revenue,
    }),
  );

  const customerSpend = new Map<string, { name: string; total: number }>();
  for (const order of orders) {
    if (!order.customer) {
      continue;
    }

    const existing = customerSpend.get(order.customer.id) ?? {
      name: order.customer.name,
      total: 0,
    };

    existing.total += Number(order.total_price ?? 0);
    customerSpend.set(order.customer.id, existing);
  }

  const topCustomers = Array.from(customerSpend.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 4)
    .map((customer, index) => ({
      name: customer.name,
      ltv: formatCurrency(customer.total),
      avatar: getInitials(customer.name),
      color: customerColors[index % customerColors.length],
    }));

  const inventoryNameById = new Map(
    inventory.map((item) => [item.id, item.name]),
  );
  const productStats = new Map<string, { units: number; revenue: number }>();

  for (const order of orders) {
    for (const item of order.order_items ?? []) {
      const productName = item.inventory_id
        ? (inventoryNameById.get(item.inventory_id) ?? item.name)
        : item.name;
      const existing = productStats.get(productName) ?? {
        units: 0,
        revenue: 0,
      };
      existing.units += Number(item.quantity ?? 0);
      existing.revenue += Number(item.price ?? 0) * Number(item.quantity ?? 0);
      productStats.set(productName, existing);
    }
  }

  const popularProducts = Array.from(productStats.entries())
    .sort((a, b) => b[1].units - a[1].units)
    .slice(0, 3)
    .map(([name, stats]) => ({
      name,
      sold: `${stats.units} units sold`,
      revenue: formatCurrency(stats.revenue),
    }));

  // Calculate totalCost for completed orders
  let totalCost = 0;
  for (const order of orders) {
    // if (order.status !== "completed") continue;
    for (const item of order.order_items ?? []) {
      // Find the inventory item to get the cost
      const inv = inventory.find((inv) => inv.id === item.inventory_id);
      const cost = inv?.cost ?? 0;
      totalCost += cost * Number(item.quantity ?? 0);
    }
  }

  const { totalProducts, lowStock, outOfStock } = inventory.reduce(
    (acc, item) => {
      acc.totalProducts++;

      if (item.stock_quantity === 0) {
        acc.outOfStock++;
      } else if (item.stock_quantity <= 5) {
        acc.lowStock++;
      }

      return acc;
    },
    { totalProducts: 0, lowStock: 0, outOfStock: 0 },
  );

  return {
    totalCost,
    totalRevenue,
    totalProfit: totalRevenue - totalCost,
    totalOrders: orders.length,
    totalCustomers: customers.length,
    completedOrders,
    trends: {
      revenue: buildTrend(currentRevenue, previousRevenue),
      orders: buildTrend(currentOrders.length, previousOrders.length),
      customers: buildTrend(currentCustomers.length, previousCustomers.length),
      completed: buildTrend(currentCompleted, previousCompleted),
    },
    revenueData,
    topCustomers,
    popularProducts,
    inventory: {
      totalProducts,
      lowStock,
      outOfStock,
    },
  };
}
