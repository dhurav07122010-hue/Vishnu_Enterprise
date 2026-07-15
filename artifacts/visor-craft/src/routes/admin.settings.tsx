import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRequireAdmin } from "@/lib/require-auth";
import { adminLogout } from "@/lib/admin-auth";
import { useNavigate } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { siteSettingsQuery, uploadSiteLogo, saveSiteLogoUrl } from "@/lib/site-settings";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock, CreditCard, LogOut, Shield, Store, ImagePlus, X } from "lucide-react";

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

function AdminSettings() {
  const ready = useRequireAdmin();
  const navigate = useNavigate();

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

      {/* Store info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Store className="h-4 w-4 text-primary" /> Store Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Store Name" value={SITE.name} />
          <Row label="Tagline" value={SITE.tagline} />
          <Row label="Description" value={SITE.description} />

          <div className="h-px bg-border" />

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p>{SITE.address.line1}</p>
              <p>{SITE.address.line2}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="hover:text-primary transition-colors">{SITE.phone}</a>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${SITE.email}`} className="hover:text-primary transition-colors">{SITE.email}</a>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{SITE.hours}</span>
          </div>
        </CardContent>
      </Card>

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
