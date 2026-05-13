import { format } from "date-fns";
import {
  Delivery,
  isSupabaseConfigured,
  supabase,
  type Customer,
  type Order,
  type OrderItem,
} from "./supabase";

export type OrderStatus = "pending" | "in_delivery" | "completed" | "canceled";

type OrderWithRelations = Order & {
  customer: Customer | null;
  order_items: OrderItem[];
  delivery?: Delivery | null;
};

export type OrderListRow = {
  id: string;
  shortId: string;
  date: string;
  customer: string;
  avatar: string;
  avatarClass: string;
  status: OrderStatus;
  items: string;
  total: string;
  delivery?: Delivery;
};

export type FetchOrdersParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: string | OrderStatus;
};

export type OrdersPage = {
  rows: OrderListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type OrderDetailItem = {
  id: string;
  inventoryId: string | null;
  name: string;
  quantity: number;
  price: number;
  source: string | null;
};

export type OrderDetails = {
  id: string;
  shortId: string;
  createdAt: string;
  status: OrderStatus;
  totalPrice: number;
  customerId: string;
  customerName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  items: OrderDetailItem[];
  delivery?: Delivery;
};

export type UpdateOrderStatusInput = {
  orderId: string;
  status: OrderStatus;
};

export type UpdateOrderInput = {
  orderId: string;
  customerId: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  items: OrderDetailItem[];
};

const avatarClasses = [
  "bg-rose-100 text-rose-600",
  "bg-sky-100 text-sky-600",
  "bg-violet-100 text-violet-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-700",
];

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function mapOrderStatus(status: Order["status"]): OrderStatus {
  switch (status) {
    case "pending":
      return "pending";
    case "canceled":
      return "canceled";
    case "completed":
      return "completed";
    case "delivery":
    default:
      return "in_delivery";
  }
}

function mapDbStatus(status: OrderStatus): Order["status"] {
  switch (status) {
    case "in_delivery":
      return "delivery";
    case "pending":
      return "pending";
    case "canceled":
      return "canceled";
    case "completed":
    default:
      return "completed";
  }
}

function splitName(name: string) {
  const [firstName = "", ...rest] = name.trim().split(" ").filter(Boolean);
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function calculateTotal(items: Pick<OrderDetailItem, "quantity" | "price">[]) {
  return items.reduce(
    (sum, item) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 0),
    0,
  );
}

export async function fetchOrders({
  page,
  pageSize,
  search = "",
  status = "all",
}: FetchOrdersParams): Promise<OrdersPage> {
  if (!isSupabaseConfigured) {
    return {
      rows: [],
      totalCount: 0,
      page,
      pageSize,
      pageCount: 0,
    };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("orders")
    .select(
      `
        id,
        customer_id,
        delivery_id,
        status,
        total_price,
        created_at,
        customer:customers!inner(id, name, phone, address, created_at),
        delivery:delivery(id, name, phone, address, created_at, enabled),
        order_items(id, order_id, inventory_id, name, quantity, price, source, created_at)
      `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (status === "completed") {
    query = query.eq("status", "completed");
  } else if (status === "in_delivery") {
    query = query.eq("status", "delivery");
  } else if (status === "pending" || status === "canceled") {
    query = query.eq("status", status);
  }

  const normalizedSearch = search.trim();
  if (normalizedSearch) {
    query = query.or(
      `name.ilike.%${normalizedSearch}%,phone.ilike.%${normalizedSearch}%`,
      { foreignTable: "customers" },
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data ?? []) as OrderWithRelations[]).map((order, index) => {
    const customerName = order.customer?.name?.trim() || "Guest Customer";
    const itemCount =
      order.order_items?.reduce(
        (sum, item) => sum + Number(item.quantity ?? 0),
        0,
      ) ?? 0;

    return {
      id: order.id,
      shortId: `#${order.id.slice(0, 4).toUpperCase()}`,
      date: format(new Date(order.created_at), "MMM dd, yyyy"),
      customer: customerName,
      avatar: getInitials(customerName) || "GC",
      avatarClass: avatarClasses[index % avatarClasses.length],
      status: mapOrderStatus(order.status),
      items: `${itemCount} ${itemCount === 1 ? "item" : "items"}`,
      delivery: order?.delivery || null,
      total: formatCurrency(Number(order.total_price ?? 0)),
    };
  });

  const totalCount = count ?? 0;

  return {
    rows,
    totalCount,
    page,
    pageSize,
    pageCount: totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize),
  };
}

export async function fetchOrderDetails(
  orderId: string,
): Promise<OrderDetails> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        customer_id,
        delivery_id,
        status,
        total_price,
        created_at,
        customer:customers(id, name, phone, address, created_at),
        delivery:delivery(id, name, phone, address, created_at, enabled),
        order_items(id, order_id, inventory_id, name, quantity, price, source, created_at)
      `,
    )
    .eq("id", orderId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const order = data as OrderWithRelations;
  const customerName = order.customer?.name?.trim() || "Guest Customer";
  const { firstName, lastName } = splitName(customerName);

  return {
    id: order.id,
    shortId: `#${order.id.slice(0, 4).toUpperCase()}`,
    createdAt: format(new Date(order.created_at), "MMM dd, yyyy"),
    status: mapOrderStatus(order.status),
    totalPrice: Number(order.total_price ?? 0),
    customerId: order.customer?.id ?? order.customer_id,
    customerName,
    firstName,
    lastName,
    email: "",
    phone: order.customer?.phone ?? "",
    address: order.customer?.address ?? "",
    items: (order.order_items ?? []).map((item) => ({
      id: item.id,
      inventoryId: item.inventory_id ?? null,
      name: item.name,
      quantity: Number(item.quantity ?? 0),
      price: Number(item.price ?? 0),
      source: item.source ?? null,
    })),
  };
}

export async function updateOrderStatus({
  orderId,
  status,
}: UpdateOrderStatusInput): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: mapDbStatus(status) })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.from("orders").delete().eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateOrder(input: UpdateOrderInput): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const customerName = [input.firstName.trim(), input.lastName.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();

  const normalizedItems = input.items.map((item) => ({
    id: item.id,
    order_id: input.orderId,
    inventory_id: item.inventoryId,
    name: item.name.trim() || "Untitled Item",
    quantity: Math.max(1, Number(item.quantity ?? 1)),
    price: Number(item.price ?? 0),
    source: item.source ?? "manual",
  }));

  const { error: customerError } = await supabase
    .from("customers")
    .update({
      name: customerName || "Guest Customer",
      phone: input.phone.trim() || null,
      address: input.address.trim() || null,
    })
    .eq("id", input.customerId);

  if (customerError) {
    throw new Error(customerError.message);
  }

  const { error: deleteItemsError } = await supabase
    .from("order_items")
    .delete()
    .eq("order_id", input.orderId);

  if (deleteItemsError) {
    throw new Error(deleteItemsError.message);
  }

  if (normalizedItems.length > 0) {
    const { error: insertItemsError } = await supabase
      .from("order_items")
      .insert(normalizedItems);

    if (insertItemsError) {
      throw new Error(insertItemsError.message);
    }
  }

  const { error: orderError } = await supabase
    .from("orders")
    .update({ total_price: calculateTotal(normalizedItems) })
    .eq("id", input.orderId);

  if (orderError) {
    throw new Error(orderError.message);
  }
}
