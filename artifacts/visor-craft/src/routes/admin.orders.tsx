import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAdmin } from "@/lib/require-auth";
import { formatPrice } from "@/lib/site";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import { Package, Search } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const ready = useRequireAdmin();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (!error && mounted) setOrders(data ?? []);
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [ready, statusFilter]);

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(s) ||
      o.customer_name?.toLowerCase().includes(s) ||
      o.customer_email?.toLowerCase().includes(s) ||
      o.customer_phone?.includes(s)
    );
  });

  async function updateOrder(orderId: string, status: string, notes: string) {
    const { error } = await supabase.from("orders").update({ status, notes }).eq("id", orderId);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status, notes } : o)));
      setDialogOpen(false);
    }
  }

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl font-bold">Orders</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email, order #…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(ORDER_STATUS_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
          Loading orders…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Package className="h-14 w-14 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">No orders found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Orders placed through the store will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <Card
              key={order.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => { setSelectedOrder(order); setDialogOpen(true); }}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold font-mono text-sm">{order.order_number}</p>
                  <p className="text-sm truncate">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {new Date(order.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <span className="font-bold">{formatPrice(order.total_cents)}</span>
                  <Badge variant="outline">{order.payment_method?.toUpperCase()}</Badge>
                  <Badge variant={order.status === "cancelled" ? "destructive" : order.status === "delivered" ? "default" : "secondary"}>
                    {ORDER_STATUS_LABEL[order.status] ?? order.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted/40 p-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Customer</p>
                  <p className="font-semibold">{selectedOrder.customer_name}</p>
                  <p className="text-muted-foreground">{selectedOrder.customer_email}</p>
                  <p className="text-muted-foreground">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Shipping</p>
                  <p>{selectedOrder.shipping_address_line1}</p>
                  {selectedOrder.shipping_address_line2 && <p>{selectedOrder.shipping_address_line2}</p>}
                  <p>{selectedOrder.shipping_city}, {selectedOrder.shipping_pincode}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Update Status</label>
                <select
                  id="order-status-select"
                  defaultValue={selectedOrder.status}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.entries(ORDER_STATUS_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Internal Notes</label>
                <textarea
                  id="order-notes"
                  defaultValue={selectedOrder.notes ?? ""}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Add internal notes…"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const statusEl = document.getElementById("order-status-select") as HTMLSelectElement | null;
                const notesEl = document.getElementById("order-notes") as HTMLTextAreaElement | null;
                const status = statusEl?.value;
                const notes = notesEl?.value ?? "";
                if (selectedOrder && status) void updateOrder(selectedOrder.id, status, notes);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
