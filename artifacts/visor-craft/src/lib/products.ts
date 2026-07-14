import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export interface Product {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  specs: Record<string, string>;
  price_cents: number;
  compare_at_price_cents: number | null;
  category_id: string | null;
  stock: number;
  rating: number;
  rating_count: number;
  is_featured: boolean;
  primary_image_url: string | null;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
}

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, short_description, description, specs, price_cents, compare_at_price_cents, category_id, stock, rating, rating_count, is_featured, primary_image_url",
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

async function fetchReviewsFor(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, product_id, customer_name, rating, title, body, created_at")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Review[];
}

export const productsQuery = () =>
  queryOptions({ queryKey: ["products"], queryFn: fetchProducts, staleTime: 60_000 });

export const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"], queryFn: fetchCategories, staleTime: 5 * 60_000 });

export const reviewsQuery = (productId: string) =>
  queryOptions({
    queryKey: ["reviews", productId],
    queryFn: () => fetchReviewsFor(productId),
    staleTime: 60_000,
  });
