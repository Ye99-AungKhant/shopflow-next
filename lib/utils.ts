import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { OrderStatus } from "./orders";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusLabel(status: OrderStatus) {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_delivery":
      return "In Delivery";
    case "pending":
      return "Pending";
    case "canceled":
      return "Canceled";
    default:
      return status;
  }
}

export function getStatusClass(status: OrderStatus) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700 font-medium px-2.5 py-0.5 rounded-full text-xs";
    case "in_delivery":
      return "bg-amber-100 text-amber-700 font-medium px-2.5 py-0.5 rounded-full text-xs";
    case "pending":
      return "bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded-full text-xs";
    case "canceled":
      return "bg-rose-100 text-rose-700 font-medium px-2.5 py-0.5 rounded-full text-xs";
    default:
      return "bg-slate-100 text-slate-700 font-medium px-2.5 py-0.5 rounded-full text-xs";
  }
}
