import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAdmin } from "@/lib/require-auth";
import { toast } from "sonner";
import { Users, Download, Search, Copy, Mail } from "lucide-react";

export const Route = createFileRoute("/admin/newsletter")({
  component: AdminNewsletter,
});

function AdminNewsletter() {
  const ready = useRequireAdmin();
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      setSubscribers(data ?? []);
      setLoading(false);
    })();
  }, [ready]);

  function exportCSV() {
    const rows = [["Email", "Joined"], ...subscribers.map((s) => [s.email, new Date(s.created_at).toLocaleDateString("en-IN")])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "newsletter-subscribers.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  }

  function copyEmails() {
    const emails = subscribers.map((s) => s.email).join(", ");
    navigator.clipboard.writeText(emails).then(() => toast.success(`${subscribers.length} emails copied`));
  }

  if (!ready) return null;

  const filtered = subscribers.filter((s) => !search || s.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Newsletter</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{subscribers.length} subscribers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyEmails} disabled={subscribers.length === 0}>
            <Copy className="mr-2 h-4 w-4" /> Copy Emails
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={subscribers.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Total Subscribers
            <span className="ml-auto text-2xl font-bold text-foreground">{loading ? "—" : subscribers.length}</span>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search emails…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mr-3" />
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20">
          <Mail className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">No subscribers yet</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((sub, i) => (
                <tr key={sub.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${sub.email}`} className="hover:text-primary transition-colors">{sub.email}</a>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {new Date(sub.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
