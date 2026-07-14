
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Package, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/site";
import { userOrdersQuery, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/orders";
import { useAuth } from "@/lib/auth";
import { useRequireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — Vishnu Enterprises" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyOrdersPage,
});

function MyOrdersPage() {
  const { user, signInWithGoogle, isLoading: authLoading } = useAuth();
  useRequireAuth();
  const { data: orders, isLoading: ordersLoading } = useSuspenseQuery(userOrdersQuery());

  if (authLoading) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-display text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    // `useRequireAuth` will redirect unauthenticated users to /login.
    return null;
  }

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">My Orders</h1>
        <p className="mt-2 text-muted-foreground">View and track all your orders</p>
      </header>

      {ordersLoading ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border bg-card p-10 text-center shadow-card-soft">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 font-display text-xl font-bold">No orders yet</h2>
          <p className="mt-2 text-muted-foreground">Start shopping to place your first order!</p>
          <Button asChild className="mt-6">
            <Link to="/store">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map(({ order, items }) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between bg-accent/30 border-b pb-4">
                <div>
                  <CardTitle className="text-lg">Order {order.order_number}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline">{ORDER_STATUS_LABEL[order.status]}</Badge>
                  <Badge>{PAYMENT_STATUS_LABEL[order.payment_status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-medium">Items:</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      {items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {item.quantity}x {item.product_name}
                          </span>
                          <span className="font-medium">{formatPrice(item.line_total_cents)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-4 w-4 text-primary" />
                      <span className="font-medium">Delivery Address:</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.shipping_address_line1}
                      {order.shipping_address_line2 && ", " + order.shipping_address_line2}
                      <br />
                      {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-display text-xl font-bold">{formatPrice(order.total_cents)}</p>
                    </div>
                    <Button asChild className="w-full">
                      <Link to="/orders/$orderNumber" params={{ orderNumber: order.order_number }}>
                        View Order Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
