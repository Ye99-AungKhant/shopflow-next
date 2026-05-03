"use client";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import { fetchDashboardData } from "../lib/dashboard";
import { isSupabaseConfigured } from "../lib/supabase";

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export function Dashboard({ refreshTrigger }: { refreshTrigger: number }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard", refreshTrigger],
    queryFn: fetchDashboardData,
    enabled: isSupabaseConfigured,
  });

  const kpiCards = [
    {
      label: "Total Cost",
      value: formatCurrency(data?.totalCost ?? 0),
      trend: data?.trends.revenue.label ?? "0% vs last week",
      trendDirection: data?.trends.revenue.direction ?? "flat",
      icon: DollarSign,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(data?.totalRevenue ?? 0),
      trend: data?.trends.revenue.label ?? "0% vs last week",
      trendDirection: data?.trends.revenue.direction ?? "flat",
      icon: DollarSign,
    },
    {
      label: "Total Profit",
      value: formatCurrency(data?.totalProfit ?? 0),
      trend: data?.trends.revenue.label ?? "0% vs last week",
      trendDirection: data?.trends.revenue.direction ?? "flat",
      icon: DollarSign,
    },
    {
      label: "Orders",
      value: String(data?.totalOrders ?? 0),
      trend: data?.trends.orders.label ?? "0% vs last week",
      trendDirection: data?.trends.orders.direction ?? "flat",
      icon: ShoppingCart,
    },
    {
      label: "Customers",
      value: String(data?.totalCustomers ?? 0),
      trend: data?.trends.customers.label ?? "0% vs last week",
      trendDirection: data?.trends.customers.direction ?? "flat",
      icon: Users,
    },
    {
      label: "Completed",
      value: String(data?.completedOrders ?? 0),
      trend: data?.trends.completed.label ?? "0% vs last week",
      trendDirection: data?.trends.completed.direction ?? "flat",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const TrendIcon =
            card.trendDirection === "down" ? ArrowDownRight : ArrowUpRight;
          const trendColor =
            card.trendDirection === "down"
              ? "text-rose-500"
              : card.trendDirection === "flat"
                ? "text-slate-500"
                : "text-emerald-500";

          return (
            <div
              key={card.label}
              className="rounded-3xl bg-white p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {card.label}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-6">
                <p className="text-4xl font-bold tracking-tight text-slate-900">
                  {card.value}
                </p>
              </div>

              <div
                className={`mt-4 flex items-center gap-2 text-sm ${trendColor}`}
              >
                <TrendIcon className="h-4 w-4" />
                <span className="font-medium">{card.trend}</span>
              </div>
            </div>
          );
        })}
      </section>

      {!isSupabaseConfigured && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)]">
          Please configure your Supabase URL and Anon Key in the environment
          variables to load dashboard data.
        </div>
      )}

      {isSupabaseConfigured && isLoading && (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)]">
          Loading dashboard data...
        </div>
      )}

      {isSupabaseConfigured && isError && (
        <div className="rounded-3xl bg-white p-8 text-center text-rose-500 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)]">
          Failed to load dashboard data:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      {isSupabaseConfigured && !isLoading && !isError && data && (
        <>
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)] xl:col-span-2">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Revenue (Last 7 Days)
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    A smooth view of daily sales momentum across the week.
                  </p>
                </div>
                <div className="rounded-2xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                  {formatCurrency(data.totalRevenue)} total
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.revenueData}
                    margin={{ top: 10, right: 8, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#4F46E5"
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="95%"
                          stopColor="#4F46E5"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `$${value.toFixed(2)}`,
                        "Revenue",
                      ]}
                      contentStyle={{
                        border: "none",
                        borderRadius: "16px",
                        boxShadow: "0 20px 40px -20px rgba(15, 23, 42, 0.25)",
                        color: "#0F172A",
                      }}
                      labelStyle={{ color: "#64748B" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4F46E5"
                      strokeWidth={3}
                      fill="url(#revenueGradient)"
                      activeDot={{
                        r: 6,
                        fill: "#4F46E5",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)]">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Top Customers
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Highest lifetime value customers from your order history.
                </p>
              </div>

              <div className="space-y-4">
                {data.topCustomers.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No customer purchases yet.
                  </p>
                )}

                {data.topCustomers.map((customer) => (
                  <div
                    key={customer.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-semibold ${customer.color}`}
                      >
                        {customer.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {customer.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Loyal repeat customer
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {customer.ltv}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)]">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Popular Products
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Best-performing items by units sold and revenue generated.
              </p>
            </div>

            <div className="space-y-4">
              {data.popularProducts.length === 0 && (
                <p className="text-sm text-slate-500">No sold products yet.</p>
              )}

              {data.popularProducts.map((product) => (
                <div
                  key={product.name}
                  className="flex flex-col gap-4 rounded-2xl bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-slate-500">{product.sold}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {product.revenue}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
