import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export interface SliderItem {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  button_text: string | null;
  button_link: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function fetchActiveSlides(): Promise<SliderItem[]> {
  const { data, error } = await supabase
    .from("slider_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.warn("[sliders] fetchActiveSlides error:", error.message);
    return [];
  }
  return (data ?? []) as SliderItem[];
}

export const slidesQuery = () =>
  queryOptions({
    queryKey: ["slides"],
    queryFn: fetchActiveSlides,
    staleTime: 60_000,
  });
