import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export interface SiteSettings {
  logo_url: string | null;
}

async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("logo_url")
    .eq("id", "default")
    .maybeSingle();

  // If the table doesn't exist yet (migration not run), fail soft with no logo.
  if (error) return { logo_url: null };
  return { logo_url: data?.logo_url ?? null };
}

export const siteSettingsQuery = () =>
  queryOptions({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
    staleTime: 60_000,
  });

export async function uploadSiteLogo(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `site/logo-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "31536000", contentType: file.type });
  if (error) throw new Error(error.message ?? "Logo upload failed");
  const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function saveSiteLogoUrl(logoUrl: string | null): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: "default", logo_url: logoUrl, updated_at: new Date().toISOString() });
  if (error) throw error;
}
