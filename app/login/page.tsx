"use client";

import { useState } from "react";
import { login, signup } from "./actions";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState<"login" | "signup" | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
        <div className="w-full max-w-2xl space-y-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
          {/* Header Section */}
          <div className="space-y-3 text-center">
            <p className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-indigo-600">
              ShopFlow
            </p>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Your daily operations, simplified.
            </h1>
            <p className="mx-auto max-w-xl text-sm text-slate-500">
              Log in to automate your order entry, update your stock, and keep
              your business running smoothly.
            </p>
          </div>

          {/* Form Section */}
          <div className="rounded-3xl border border-slate-100 bg-white p-2 sm:p-4">
            <form className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700"
                >
                  Shop Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Your Shop Name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button
                  formAction={async (formData) => {
                    setLoading("login");
                    await login(formData);
                    setLoading(null);
                  }}
                  disabled={loading !== null}
                  className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading === "login" && (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  )}
                  Log in
                </button>

                <span className="text-sm font-medium text-slate-400 shrink-0">
                  - or -
                </span>

                <button
                  formAction={async (formData) => {
                    setLoading("signup");
                    await signup(formData);
                    setLoading(null);
                  }}
                  disabled={loading !== null}
                  className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading === "signup" && (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-700" />
                  )}
                  Sign up
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
