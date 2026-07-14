import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, MessageCircle, Package, Truck, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { orderQuery, ORDER_STATUS_LABEL, ORDER_STATUS_STEPS, PAYMENT_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/orders";
import { formatPrice, SITE } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders/$orderNumber")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(orderQuery(params.orderNumber));
    if (!data) throw notFound();
  },
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.orderNumber} — Vishnu Enterprises` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Order not found</h1>
      <p className="mt-2 text-muted-foreground">Double-check the order number.</p>
      <Button asChild className="mt-6"><Link to="/track">Track another order</Link></Button>
    </div>
  ),
});

function OrderPage() {
  const { orderNumber } = Route.useParams();
  const { data } = useSuspenseQuery(orderQuery(orderNumber));
  const { order, items, screenshots } = data!;
  const isCancelled = order.status === "cancelled";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const message = encodeURIComponent(
    `Hi Vishnu Enterprises! I just placed order ${order.order_number}. Please confirm.`,
  );
  const waLink = `https://wa.me/${SITE.whatsapp}?text=${message}`;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${order.order_number}-${Date.now()}.${fileExt}`;
      const filePath = `payment-screenshots/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images') // Using product-images for now (we can change later)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) throw new Error('Could not get public URL');

      // Insert into payment_screenshots table
      const { error: insertError } = await supabase
        .from('payment_screenshots')
        .insert({
          order_id: order.id,
          image_url: urlData.publicUrl,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Invalidate order query to refresh data
      await queryClient.invalidateQueries({ queryKey: orderQuery(orderNumber).queryKey });
      toast.success('Payment screenshot uploaded!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload payment screenshot');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-hero-gradient p-8 text-navy-foreground shadow-elegant sm:p-10">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-navy-foreground/10">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-navy-foreground/70">Order placed</p>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">Thank you, {order.customer_name.split(" ")[0]}!</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-navy-foreground/80">
            We've received your order and will confirm it shortly on WhatsApp.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-navy-foreground/10 px-4 py-2">
              <span className="text-xs uppercase tracking-wider text-navy-foreground/60">Order #</span>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold">{order.order_number}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(order.order_number);
                    toast.success("Order number copied");
                  }}
                  className="rounded-md p-1 hover:bg-navy-foreground/10"
                  aria-label="Copy order number"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <Button asChild variant="outline" className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground">
              <a href={waLink} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" /> Message us on WhatsApp
              </a>
            </Button>
          </div>
        </div>

        {/* Status stepper */}
        <section className="mt-8 rounded-2xl border bg-card p-6 shadow-card-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Order status</h2>
            <Badge variant={isCancelled ? "destructive" : "secondary"}>
              {ORDER_STATUS_LABEL[order.status] ?? order.status}
            </Badge>
          </div>
          {!isCancelled && (
            <ol className="mt-6 grid gap-4 sm:grid-cols-5">
              {ORDER_STATUS_STEPS.map((step, index) => {
                const currentIndex = ORDER_STATUS_STEPS.indexOf(order.status as (typeof ORDER_STATUS_STEPS)[number]);
                const done = currentIndex >= index;
                return (
                  <li key={step} className="flex flex-col items-start gap-1.5 sm:items-center sm:text-center">
                    <span
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-bold",
                        done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </span>
                    <span className={cn("text-xs font-medium", done ? "text-foreground" : "text-muted-foreground")}>
                      {ORDER_STATUS_LABEL[step]}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Items */}
        <section className="mt-6 rounded-2xl border bg-card p-6 shadow-card-soft">
          <h2 className="font-display text-lg font-semibold">Items ({items.length})</h2>
          <ul className="mt-4 divide-y">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">Qty {item.quantity} × {formatPrice(item.unit_price_cents)}</p>
                </div>
                <p className="font-semibold">{formatPrice(item.line_total_cents)}</p>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatPrice(order.subtotal_cents)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="text-success">{order.shipping_cents === 0 ? "Free" : formatPrice(order.shipping_cents)}</dd></div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base"><dt className="font-semibold">Total</dt><dd className="font-display text-xl font-bold">{formatPrice(order.total_cents)}</dd></div>
          </dl>
        </section>

        {/* Details */}
      <section className="mt-6 grid gap-6 rounded-2xl border bg-card p-6 shadow-card-soft sm:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 font-semibold"><Package className="h-4 w-4 text-primary" /> Payment</h3>
          <p className="mt-2 text-sm">{PAYMENT_LABEL[order.payment_method] ?? order.payment_method}</p>
          <p className="text-xs text-muted-foreground">
            Status: <span className="font-medium text-foreground">{PAYMENT_STATUS_LABEL[order.payment_status] ?? order.payment_status}</span>
          </p>

          {order.payment_method === "upi" && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Upload Payment Screenshot</p>
                <div className="relative">
                  <Input
                    id="payment-screenshot"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>

              {screenshots.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Screenshots</p>
                  <div className="grid grid-cols-2 gap-2">
                    {screenshots.map((screenshot) => (
                      <div key={screenshot.id} className="relative rounded-lg border overflow-hidden">
                        <img
                          src={screenshot.image_url}
                          alt="Payment screenshot"
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="capitalize">
                            {screenshot.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <h3 className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4 text-primary" /> Ships to</h3>
          <p className="mt-2 text-sm">{order.customer_name}</p>
          <p className="text-sm text-muted-foreground">
            {order.shipping_address_line1}
            {order.shipping_address_line2 ? `, ${order.shipping_address_line2}` : ""}
            <br />
            {order.shipping_city}, {order.shipping_state} — {order.shipping_pincode}
            {order.shipping_landmark ? <><br />Landmark: {order.shipping_landmark}</> : null}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{order.customer_phone} · {order.customer_email}</p>
        </div>
      </section>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline"><Link to="/store">Continue shopping</Link></Button>
          <Button asChild variant="ghost"><Link to="/track">Track another order</Link></Button>
        </div>
      </div>
    </div>
  );
}
