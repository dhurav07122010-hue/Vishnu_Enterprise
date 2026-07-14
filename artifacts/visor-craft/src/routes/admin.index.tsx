import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, TrendingUp, Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAdmin } from "@/lib/require-auth";
import { formatPrice } from "@/lib/site";
import { ORDER_STATUS_LABEL } from "@/lib/orders";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const ready = useRequireAdmin();
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, subscribers: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const [
        { count: orderCount },
        { data: revenueData },
        { count: productCount },
        { count: subCount },
        { data: recent },
      ] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total_cents"),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      const revenue = (revenueData ?? []).reduce((s: number, o: any) => s + (o.total_cents ?? 0), 0);
      setStats({
        orders: orderCount ?? 0,
        revenue,
        products: productCount ?? 0,
        subscribers: subCount ?? 0,
      });
      setRecentOrders(recent ?? []);
      setLoading(false);
    })();
  }, [ready]);

  if (!ready) return null;

  const statCards = [
    { title: "Total Orders", value: stats.orders, icon: <ShoppingCart className="h-5 w-5 text-primary" />, fmt: (v: number) => v.toString() },
    { title: "Total Revenue", value: stats.revenue, icon: <TrendingUp className="h-5 w-5 text-green-500" />, fmt: formatPrice },
    { title: "Products", value: stats.products, icon: <Package className="h-5 w-5 text-blue-500" />, fmt: (v: number) => v.toString() },
    { title: "Newsletter", value: stats.subscribers, icon: <Users className="h-5 w-5 text-purple-500" />, fmt: (v: number) => v.toString() },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your store</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className="rounded-lg bg-muted p-1.5">{card.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <span className="animate-pulse text-muted-foreground">—</span> : card.fmt(card.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/orders">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Loading…</p>
          ) : recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No orders yet</p>
          ) : (
            <div className="space-y-0 divide-y">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.customer_name} · {order.customer_email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold">{formatPrice(order.total_cents)}</span>
                    <Badge variant={order.status === "cancelled" ? "destructive" : order.status === "delivered" ? "default" : "secondary"} className="text-xs">
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickLink to="/admin/products" icon={<Package className="h-5 w-5" />} title="Manage Products" desc="Add, edit or remove visors" />
        <QuickLink to="/admin/orders" icon={<ShoppingCart className="h-5 w-5" />} title="Manage Orders" desc="Update order status" />
        <QuickLink to="/admin/messages" icon={<Users className="h-5 w-5" />} title="Messages" desc="Customer enquiries" />
      </div>
    </div>
  );
}

function QuickLink({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <Link to={to}>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Link>
    </Card>
  );
}
