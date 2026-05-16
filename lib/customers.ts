import { Customer, isSupabaseConfigured, supabase } from "./supabase";

type CustomerRow = {
  id: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
};

export type CustomerUpsertInput = {
  name: string;
  phone: string;
  address: string;
};

/** Escape `%`, `_`, and commas for Postgres ILIKE patterns (comma breaks PostgREST `.or()` clauses). */
function escapeIlikePattern(term: string): string {
  return term
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/,/g, " ");
}

function mapRow(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: String(row.name ?? "").trim() || "—",
    phone: String(row.phone ?? ""),
    address: String(row.address ?? ""),
    created_at: row.created_at,
  };
}

function assertSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured.");
  }
}

/**
 * Loads from the `customers` table (`Customer` in `lib/supabase.ts`).
 * Optional `search` filters with ILIKE across name, phone, and address.
 */
export async function fetchCustomers(search?: string): Promise<Customer[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  let query = supabase
    .from("customers")
    .select("id, name, phone, address, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const raw = search?.trim().slice(0, 200) ?? "";
  if (raw) {
    const pat = `%${escapeIlikePattern(raw)}%`;
    query = query.or(
      `name.ilike.${pat},phone.ilike.${pat},address.ilike.${pat}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: CustomerRow) => mapRow(row));
}

export async function createCustomer(
  input: CustomerUpsertInput,
): Promise<Customer> {
  assertSupabase();
  const name = input.name.trim();
  if (!name) {
    throw new Error("Name is required.");
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      name,
      phone: input.phone.trim() || null,
      address: input.address.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRow(data as CustomerRow);
}

export async function updateCustomer(
  id: string,
  input: CustomerUpsertInput,
): Promise<void> {
  assertSupabase();
  const name = input.name.trim();
  if (!name) {
    throw new Error("Name is required.");
  }

  const { error } = await supabase
    .from("customers")
    .update({
      name,
      phone: input.phone.trim() || null,
      address: input.address.trim() || null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  assertSupabase();

  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
