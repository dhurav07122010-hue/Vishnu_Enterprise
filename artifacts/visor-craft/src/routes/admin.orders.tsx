import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAdmin } from "@/lib/require-auth";
import { formatPrice } from "@/lib/site";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/orders";
import { Package, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

  // Controlled edit state — reset whenever a new order is opened
  const [editStatus, setEditStatus] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState("");
  const [editTrackingCode, setEditTrackingCode] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

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

  // Sync controlled fields whenever the selected order changes
  useEffect(() => {
    if (selectedOrder) {
      setEditStatus(selectedOrder.status ?? "pending");
      setEditPaymentStatus(selectedOrder.payment_status ?? "pending");
      setEditTrackingCode(selectedOrder.tracking_code ?? "");
      setEditNotes(selectedOrder.notes ?? "");
    }
  }, [selectedOrder]);

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

  async function handleSave() {
    if (!selectedOrder) return;
    setSaving(true);
    const updates: Record<string, string | null> = {
      status: editStatus,
      payment_status: editPaymentStatus,
      tracking_code: editTrackingCode.trim() || null,
      notes: editNotes.trim() || null,
    };
    const { error } = await supabase.from("orders").update(updates).eq("id", selectedOrder.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save changes");
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrder.id ? { ...o, ...updates } : o))
    );
    toast.success("Order updated");
    setDialogOpen(false);
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
              {/* Customer + address summary */}
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

              <Separator />

              {/* Order Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Order Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORDER_STATUS_LABEL).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Payment Status</label>
                <Select value={editPaymentStatus} onValueChange={setEditPaymentStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_STATUS_LABEL).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tracking Code */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tracking Code</label>
                <Input
                  value={editTrackingCode}
                  onChange={(e) => setEditTrackingCode(e.target.value)}
                  placeholder="e.g. DTDC1234567890"
                />
              </div>

              {/* Internal Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Internal Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Add internal notes…"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
