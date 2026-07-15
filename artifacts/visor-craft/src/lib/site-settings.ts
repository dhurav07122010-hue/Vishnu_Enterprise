import { supabase } from "@/integrations/supabase/client";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { SITE } from "@/lib/site";

export interface SiteSettings {
  logo_url: string | null;
  name: string | null;
  tagline: string | null;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address_line1: string | null;
  address_line2: string | null;
  hours: string | null;
}

const EMPTY_SETTINGS: SiteSettings = {
  logo_url: null,
  name: null,
  tagline: null,
  description: null,
  meta_title: null,
  meta_description: null,
  meta_keywords: null,
  email: null,
  phone: null,
  whatsapp: null,
  address_line1: null,
  address_line2: null,
  hours: null,
};

const SETTINGS_COLUMNS =
  "logo_url,name,tagline,description,meta_title,meta_description,meta_keywords,email,phone,whatsapp,address_line1,address_line2,hours";

async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select(SETTINGS_COLUMNS)
    .eq("id", "default")
    .maybeSingle();

  // If the table/columns don't exist yet (migration not run), fail soft with defaults.
  if (error) return EMPTY_SETTINGS;
  return { ...EMPTY_SETTINGS, ...(data as Partial<SiteSettings> | null) };
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

export type EditableSiteSettings = Omit<SiteSettings, "logo_url">;

/** Save the editable text fields (name, tagline, description, SEO tags, contact info). */
export async function saveSiteSettings(fields: Partial<EditableSiteSettings>): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: "default", ...fields, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/** Merged, always-defined site info: DB values from Admin → Settings, falling back to SITE defaults. */
export interface SiteInfo {
  name: string;
  tagline: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  email: string;
  phone: string;
  whatsapp: string;
  addressLine1: string;
  addressLine2: string;
  hours: string;
  logoUrl: string | null;
}

export function useSiteInfo(): SiteInfo {
  const { data } = useQuery(siteSettingsQuery());
  return {
    name: data?.name || SITE.name,
    tagline: data?.tagline || SITE.tagline,
    description: data?.description || SITE.description,
    metaTitle: data?.meta_title || SITE.name,
    metaDescription: data?.meta_description || SITE.description,
    metaKeywords: data?.meta_keywords || "",
    email: data?.email || SITE.email,
    phone: data?.phone || SITE.phone,
    whatsapp: data?.whatsapp || SITE.whatsapp,
    addressLine1: data?.address_line1 || SITE.address.line1,
    addressLine2: data?.address_line2 || SITE.address.line2,
    hours: data?.hours || SITE.hours,
    logoUrl: data?.logo_url ?? null,
  };
}
