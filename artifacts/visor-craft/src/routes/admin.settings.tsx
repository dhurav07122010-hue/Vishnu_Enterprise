import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRequireAdmin } from "@/lib/require-auth";
import { adminLogout } from "@/lib/admin-auth";
import { useNavigate } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import {
  siteSettingsQuery,
  uploadSiteLogo,
  saveSiteLogoUrl,
  saveSiteSettings,
  type EditableSiteSettings,
} from "@/lib/site-settings";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  CreditCard,
  LogOut,
  Shield,
  Store,
  ImagePlus,
  X,
  Tags,
  Save,
} from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function LogoSettingsCard() {
  const queryClient = useQueryClient();
  const { data: siteSettings } = useQuery(siteSettingsQuery());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadSiteLogo(file);
      await saveSiteLogoUrl(url);
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Logo updated");
    } catch (err: any) {
      toast.error(err.message ?? "Logo upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    try {
      await saveSiteLogoUrl(null);
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Logo removed");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to remove logo");
    }
  }

  const logoUrl = siteSettings?.logo_url ?? null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><ImagePlus className="h-4 w-4 text-primary" /> Store Logo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-muted-foreground">Shown centered in the site header. Recommended: a wide rectangle, transparent background.</p>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {logoUrl ? (
          <div className="relative group flex items-center justify-center rounded-xl border bg-muted/40 p-4">
            <img src={logoUrl} alt="Store logo" className="h-16 max-w-[240px] object-contain" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="secondary" type="button" onClick={() => fileInputRef.current?.click()}>
                Change
              </Button>
              <Button size="sm" variant="destructive" type="button" onClick={handleRemove}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-24 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click to upload logo</span>
          </button>
        )}
        {uploading && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
            Uploading…
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** Editable form fields, prefilled from the DB (Admin → Settings) with SITE constants as fallback defaults. */
function useSettingsForm() {
  const { data: siteSettings } = useQuery(siteSettingsQuery());
  const [form, setForm] = useState<EditableSiteSettings>({
    name: SITE.name,
    tagline: SITE.tagline,
    description: SITE.description,
    meta_title: SITE.name,
    meta_description: SITE.description,
    meta_keywords: "",
    email: SITE.email,
    phone: SITE.phone,
    whatsapp: SITE.whatsapp,
    address_line1: SITE.address.line1,
    address_line2: SITE.address.line2,
    hours: SITE.hours,
  });
  const [loadedFromDb, setLoadedFromDb] = useState(false);

  useEffect(() => {
    if (!siteSettings || loadedFromDb) return;
    setForm({
      name: siteSettings.name || SITE.name,
      tagline: siteSettings.tagline || SITE.tagline,
      description: siteSettings.description || SITE.description,
      meta_title: siteSettings.meta_title || SITE.name,
      meta_description: siteSettings.meta_description || SITE.description,
      meta_keywords: siteSettings.meta_keywords || "",
      email: siteSettings.email || SITE.email,
      phone: siteSettings.phone || SITE.phone,
      whatsapp: siteSettings.whatsapp || SITE.whatsapp,
      address_line1: siteSettings.address_line1 || SITE.address.line1,
      address_line2: siteSettings.address_line2 || SITE.address.line2,
      hours: siteSettings.hours || SITE.hours,
    });
    setLoadedFromDb(true);
  }, [siteSettings, loadedFromDb]);

  function update<K extends keyof EditableSiteSettings>(key: K, value: EditableSiteSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return { form, update };
}

function StoreInfoCard({
  form,
  update,
}: {
  form: EditableSiteSettings;
  update: <K extends keyof EditableSiteSettings>(key: K, value: EditableSiteSettings[K]) => void;
}) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await saveSiteSettings({
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        email: form.email,
        phone: form.phone,
        whatsapp: form.whatsapp,
        address_line1: form.address_line1,
        address_line2: form.address_line2,
        hours: form.hours,
      });
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Store information updated");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Store className="h-4 w-4 text-primary" /> Store Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-1.5">
          <Label htmlFor="s-name">Store name</Label>
          <Input id="s-name" value={form.name ?? ""} onChange={(e) => update("name", e.target.value)} maxLength={100} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-tagline">Tagline</Label>
          <Input id="s-tagline" value={form.tagline ?? ""} onChange={(e) => update("tagline", e.target.value)} maxLength={150} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-description">Description</Label>
          <Textarea
            id="s-description"
            value={form.description ?? ""}
            onChange={(e) => update("description", e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>

        <div className="h-px bg-border" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="s-addr1" className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Address line 1</Label>
            <Input id="s-addr1" value={form.address_line1 ?? ""} onChange={(e) => update("address_line1", e.target.value)} maxLength={150} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-addr2">Address line 2</Label>
            <Input id="s-addr2" value={form.address_line2 ?? ""} onChange={(e) => update("address_line2", e.target.value)} maxLength={150} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-phone" className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone</Label>
            <Input id="s-phone" value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} maxLength={20} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-whatsapp">WhatsApp number</Label>
            <Input
              id="s-whatsapp"
              value={form.whatsapp ?? ""}
              onChange={(e) => update("whatsapp", e.target.value)}
              maxLength={20}
              placeholder="Digits only, e.g. 917982694772"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-email" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email</Label>
            <Input id="s-email" type="email" value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-hours" className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-muted-foreground" /> Business hours</Label>
            <Input id="s-hours" value={form.hours ?? ""} onChange={(e) => update("hours", e.target.value)} maxLength={100} />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="mt-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save store info"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SeoCard({
  form,
  update,
}: {
  form: EditableSiteSettings;
  update: <K extends keyof EditableSiteSettings>(key: K, value: EditableSiteSettings[K]) => void;
}) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await saveSiteSettings({
        meta_title: form.meta_title,
        meta_description: form.meta_description,
        meta_keywords: form.meta_keywords,
      });
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Website tags updated");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Tags className="h-4 w-4 text-primary" /> Website Tags (SEO)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-xs text-muted-foreground">
          Shown in the browser tab, search results, and link previews on social media.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="s-meta-title">Page title</Label>
          <Input id="s-meta-title" value={form.meta_title ?? ""} onChange={(e) => update("meta_title", e.target.value)} maxLength={70} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-meta-description">Meta description</Label>
          <Textarea
            id="s-meta-description"
            value={form.meta_description ?? ""}
            onChange={(e) => update("meta_description", e.target.value)}
            maxLength={300}
            rows={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-meta-keywords">Keywords</Label>
          <Input
            id="s-meta-keywords"
            value={form.meta_keywords ?? ""}
            onChange={(e) => update("meta_keywords", e.target.value)}
            maxLength={300}
            placeholder="helmet visors, mirror visor, Delhi"
          />
          <p className="text-xs text-muted-foreground">Comma-separated.</p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="mt-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save website tags"}
        </Button>
      </CardContent>
    </Card>
  );
}

function AdminSettings() {
  const ready = useRequireAdmin();
  const navigate = useNavigate();
  const { form, update } = useSettingsForm();

  if (!ready) return null;

  function handleLogout() {
    adminLogout();
    void navigate({ to: "/admin-login" });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Store configuration overview</p>
      </div>

      <LogoSettingsCard />

      <StoreInfoCard form={form} update={update} />

      <SeoCard form={form} update={update} />

      {/* Payments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4 text-primary" /> Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Cash on Delivery</span>
            <Badge variant="default">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span>UPI</span>
              <p className="text-xs text-muted-foreground font-mono">{SITE.upi.id}</p>
            </div>
            <Badge variant="default">Active</Badge>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            To change store info or payment details, edit <code className="bg-muted px-1 rounded">src/lib/site.ts</code> in the project.
          </p>
        </CardContent>
      </Card>

      {/* Admin security */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4 text-primary" /> Admin Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Row label="Username" value="admin" />
          <Row label="Password" value="••••••••" />
          <p className="text-xs text-muted-foreground">
            To change credentials, edit <code className="bg-muted px-1 rounded">src/lib/admin-auth.ts</code>.
          </p>
          <Button variant="destructive" size="sm" onClick={handleLogout} className="mt-2">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out of Admin
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <p className="w-32 shrink-0 text-muted-foreground">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
