import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRequireAdmin } from "@/lib/require-auth";
import { adminLogout } from "@/lib/admin-auth";
import { useNavigate } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { MapPin, Phone, Mail, Clock, CreditCard, LogOut, Shield, Store } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

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
