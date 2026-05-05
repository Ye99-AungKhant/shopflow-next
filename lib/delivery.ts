import {
  isSupabaseConfigured,
  supabase,
  type Customer,
  type InventoryItem,
  type Order,
  type Delivery,
} from "./supabase";

/**
 * Create a new delivery in Supabase
 * @param delivery Partial delivery object (name, phone, address, enabled)
 */
export async function createDelivery(
  delivery: Omit<Delivery, "id" | "created_at">,
) {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("delivery")
    .insert([delivery])
    .single();
  if (error) throw error;
  return data as Delivery;
}

/**
 * Retrieve all deliveries from Supabase
 */
export async function getDeliveries(): Promise<Delivery[]> {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("delivery")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Delivery[];
}
