import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : // Mock client if not configured so the app doesn't crash on load
    (null as any);

export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
};

export type Order = {
  id: string;
  customer_id: string;
  delivery_id: string;
  status: "pending" | "delivery" | "completed" | "canceled";
  total_price: number;
  created_at: string;
  customer?: Customer; // populated when joined
  delivery?: Delivery; // populated when joined
  order_items?: OrderItem[]; // populated when joined
};

export type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  stock_quantity: number;
  price: number;
  cost: number; // Added cost field
  photo_url?: string; // Add photo_url for item image
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  inventory_id: string | null;
  name: string;
  quantity: number;
  price: number;
  source: string;
  created_at: string;
};

export type Delivery = {
  id: string;
  order_id: string;
  name: string;
  phone: string;
  address?: string;
  created_at: string;
};
