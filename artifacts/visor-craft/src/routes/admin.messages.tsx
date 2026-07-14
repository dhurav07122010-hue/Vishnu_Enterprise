import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAdmin } from "@/lib/require-auth";
import { Mail, Phone, Search, CheckCheck, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/admin/messages")({
  component: AdminMessages,
});

function AdminMessages() {
  const ready = useRequireAdmin();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      setMessages(data ?? []);
      setLoading(false);
    })();
  }, [ready]);

  async function markRead(id: string) {
    const { error } = await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
    if (!error) setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: true } : m));
  }

  if (!ready) return null;

  const unread = messages.filter((m) => !m.is_read).length;
  const filtered = messages.filter((m) =>
    !search ||
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Messages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {messages.length} total
            {unread > 0 && <span className="ml-2 text-primary font-medium">· {unread} unread</span>}
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search name, email, subject…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent mr-3" />
          Loading messages…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20">
          <Mail className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg) => {
            const isOpen = expanded === msg.id;
            return (
              <Card key={msg.id} className={`overflow-hidden transition-shadow ${!msg.is_read ? "border-primary/40 shadow-sm" : ""}`}>
                <button
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-4"
                  onClick={() => setExpanded(isOpen ? null : msg.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{msg.name}</p>
                      {!msg.is_read && <Badge className="text-[10px] h-4 px-1.5">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{msg.subject || "No subject"}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {new Date(msg.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t bg-muted/20 pt-4 space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${msg.email}`} className="hover:text-foreground transition-colors">{msg.email}</a>
                      </div>
                      {msg.phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${msg.phone}`} className="hover:text-foreground transition-colors">{msg.phone}</a>
                        </div>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap rounded-xl bg-background border p-4">{msg.message}</p>
                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="outline">
                        <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || "Your enquiry")}`}>
                          Reply by email
                        </a>
                      </Button>
                      {!msg.is_read && (
                        <Button size="sm" variant="ghost" onClick={() => markRead(msg.id)}>
                          <CheckCheck className="mr-1.5 h-4 w-4" /> Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
