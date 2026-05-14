import {
  isSupabaseConfigured,
  supabase,
  type Customer,
  type InventoryItem,
  type Order,
  type Delivery,
  Payment,
} from "./supabase";

export async function createPayment(
  payment: Omit<Payment, "id" | "created_at">,
) {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("payment")
    .insert([payment])
    .single();
  if (error) throw error;
  return data as Payment;
}

/**
 * Retrieve all deliveries from Supabase
 */
export async function getPayments(): Promise<Payment[]> {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("payment")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Payment[];
}

/**
 * Update an existing delivery in Supabase
 * @param id Delivery ID
 * @param updates Partial delivery object
 */
export async function updatePayment(
  id: string,
  updates: Partial<Omit<Payment, "id" | "created_at">>,
) {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("payment")
    .update(updates)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Payment;
}
