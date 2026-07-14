import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_landmark: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  notes: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  tracking_code: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
}

export interface PaymentScreenshotRow {
  id: string;
  order_id: string;
  image_url: string;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems {
  order: OrderRow;
  items: OrderItemRow[];
  screenshots: PaymentScreenshotRow[];
}

async function fetchOrder(orderNumber: string): Promise<OrderWithItems | null> {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw error;
  if (!order) return null;
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);
  if (itemsError) throw itemsError;
  const { data: screenshots, error: screenshotsError } = await supabase
    .from("payment_screenshots")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false });
  if (screenshotsError) throw screenshotsError;
  return {
    order: order as OrderRow,
    items: (items ?? []) as OrderItemRow[],
    screenshots: (screenshots ?? []) as PaymentScreenshotRow[],
  };
}

async function fetchUserOrders(): Promise<OrderWithItems[]> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const orderPromises = (orders ?? []).map(async (order) => {
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);
    if (itemsError) throw itemsError;
    const { data: screenshots, error: screenshotsError } = await supabase
      .from("payment_screenshots")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false });
    if (screenshotsError) throw screenshotsError;
    return {
      order: order as OrderRow,
      items: (items ?? []) as OrderItemRow[],
      screenshots: (screenshots ?? []) as PaymentScreenshotRow[],
    };
  });
  return Promise.all(orderPromises);
}

export const userOrdersQuery = () =>
  queryOptions({
    queryKey: ["userOrders"],
    queryFn: () => fetchUserOrders(),
    staleTime: 15_000,
  });

export const orderQuery = (orderNumber: string) =>
  queryOptions({
    queryKey: ["order", orderNumber],
    queryFn: () => fetchOrder(orderNumber),
    staleTime: 15_000,
  });

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending confirmation",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_STEPS = ["pending", "confirmed", "packed", "shipped", "delivered"] as const;

export const PAYMENT_LABEL: Record<string, string> = {
  cod: "Cash on Delivery",
  upi: "UPI",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};
