import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { OrderStatus } from "./orders";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useAutoFlipDropdown(
  anchorRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  setOpenMenuId: Dispatch<SetStateAction<string | null>>,
  estimatedHeight = 260,
) {
  const [flipped, setFlipped] = useState(false);

  useLayoutEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      setFlipped(false);
      return;
    }

    const anchor = anchorRef.current;

    if (!anchor) {
      setFlipped(false);
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    setFlipped(spaceBelow < estimatedHeight && spaceAbove > estimatedHeight);
  }, [anchorRef, estimatedHeight, isOpen]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      // Only close if the menu is open AND the click was outside of it
      if (
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return flipped;
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
