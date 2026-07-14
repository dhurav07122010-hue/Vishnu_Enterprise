import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Banknote, Loader2, Lock, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cart, useCart, useCartSubtotal, SHIPPING_FEE_CENTS } from "@/lib/cart";
import { formatPrice, SITE } from "@/lib/site";
import { resolveProductImage } from "@/lib/product-images";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Vishnu Enterprises" },
      { name: "description", content: "Complete your order with Cash on Delivery or UPI." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const schema = z.object({
  customer_name: z.string().trim().min(1, "Name is required").max(100),
  customer_email: z.string().trim().email("Invalid email").max(200),
  customer_phone: z.string().trim().regex(/^[0-9+\-\s]{6,20}$/, "Enter a valid phone number"),
  shipping_address_line1: z.string().trim().min(3, "Address is required").max(300),
  shipping_address_line2: z.string().trim().max(300).optional().or(z.literal("")),
  shipping_landmark: z.string().trim().max(150).optional().or(z.literal("")),
  shipping_city: z.string().trim().min(1, "City is required").max(100),
  shipping_state: z.string().trim().min(1, "State is required").max(100),
  shipping_pincode: z.string().trim().regex(/^[0-9]{4,10}$/, "Invalid pincode"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  payment_method: z.enum(["cod", "upi"]),
});

interface CheckoutForm {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address_line1: string;
  shipping_address_line2: string;
  shipping_landmark: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  notes: string;
  payment_method: "cod" | "upi";
}

const emptyForm: CheckoutForm = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  shipping_address_line1: "",
  shipping_address_line2: "",
  shipping_landmark: "",
  shipping_city: "",
  shipping_state: "Delhi",
  shipping_pincode: "",
  notes: "",
  payment_method: "cod",
};

function CheckoutPage() {
  const items = useCart();
  const subtotal = useCartSubtotal();
  const shipping = items.length > 0 ? SHIPPING_FEE_CENTS : 0;
  const total = subtotal + shipping;
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const { user, isLoading: authLoading, signInWithGoogle } = useAuth();

  // Check authentication and redirect if not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect unauthenticated users to home
      toast.error("Please sign in to place an order");
      navigate({ to: "/" });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (items.length === 0 && !loading) {
      // let the effect run after hydration; don't redirect from event handler
    }
  }, [items.length, loading]);

  function update<K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Prevent rendering if not authenticated or still loading auth
  if (authLoading || !user) {
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Ensure user is authenticated
    if (!user) {
      toast.error("You must be signed in to place an order");
      signInWithGoogle();
      return;
    }
    
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Please check the form");
      return;
    }
    setLoading(true);
    try {
      // Generate order number via RPC
      const { data: orderNumberData, error: rpcError } = await supabase.rpc("generate_order_number");
      if (rpcError) throw rpcError;

      const orderPayload = {
        order_number: orderNumberData as string,
        status: "pending",
        payment_method: parsed.data.payment_method,
        payment_status: "pending",
        customer_name: parsed.data.customer_name,
        customer_email: parsed.data.customer_email,
        customer_phone: parsed.data.customer_phone,
        shipping_address_line1: parsed.data.shipping_address_line1,
        shipping_address_line2: parsed.data.shipping_address_line2 || null,
        shipping_landmark: parsed.data.shipping_landmark || null,
        shipping_city: parsed.data.shipping_city,
        shipping_state: parsed.data.shipping_state,
        shipping_pincode: parsed.data.shipping_pincode,
        notes: parsed.data.notes || null,
        subtotal_cents: subtotal,
        shipping_cents: shipping,
        total_cents: total,
        currency: "INR",
        user_id: user.id,
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select("id, order_number")
        .single();
      if (orderError) throw orderError;

      const itemsPayload = items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        product_name: i.name,
        product_slug: i.slug,
        unit_price_cents: i.priceCents,
        quantity: i.quantity,
        line_total_cents: i.priceCents * i.quantity,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);
      if (itemsError) throw itemsError;

      cart.clear();
      toast.success("Order placed!");
      navigate({ to: "/orders/$orderNumber", params: { orderNumber: order.order_number } });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't place your order. Please try again or WhatsApp us.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-10 md:py-14">
      <Link to="/cart" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to cart
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Checkout</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Your info is only used to fulfil this order.
        </p>
      </header>

      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {/* Contact */}
          <section className="rounded-2xl border bg-card p-6 shadow-card-soft">
            <h2 className="font-display text-lg font-semibold">Contact details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="customer_name">Full name *</Label>
                <Input id="customer_name" required maxLength={100} value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="customer_email">Email *</Label>
                <Input id="customer_email" type="email" required maxLength={200} value={form.customer_email} onChange={(e) => update("customer_email", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="customer_phone">Phone / WhatsApp *</Label>
                <Input id="customer_phone" type="tel" required maxLength={20} value={form.customer_phone} onChange={(e) => update("customer_phone", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Shipping */}
          <section className="rounded-2xl border bg-card p-6 shadow-card-soft">
            <h2 className="font-display text-lg font-semibold">Delivery address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="line1">Address line 1 *</Label>
                <Input id="line1" required maxLength={300} value={form.shipping_address_line1} onChange={(e) => update("shipping_address_line1", e.target.value)} placeholder="House / building / street" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="line2">Address line 2</Label>
                <Input id="line2" maxLength={300} value={form.shipping_address_line2} onChange={(e) => update("shipping_address_line2", e.target.value)} placeholder="Area, apartment, etc." />
              </div>
              <div>
                <Label htmlFor="landmark">Landmark</Label>
                <Input id="landmark" maxLength={150} value={form.shipping_landmark} onChange={(e) => update("shipping_landmark", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pincode">PIN code *</Label>
                <Input id="pincode" required inputMode="numeric" maxLength={10} value={form.shipping_pincode} onChange={(e) => update("shipping_pincode", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input id="city" required maxLength={100} value={form.shipping_city} onChange={(e) => update("shipping_city", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input id="state" required maxLength={100} value={form.shipping_state} onChange={(e) => update("shipping_state", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Order notes (optional)</Label>
                <Textarea id="notes" maxLength={500} rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border bg-card p-6 shadow-card-soft">
            <h2 className="font-display text-lg font-semibold">Payment method</h2>
            <RadioGroup
              value={form.payment_method}
              onValueChange={(v) => update("payment_method", v as "cod" | "upi")}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              <PaymentOption
                value="cod"
                selected={form.payment_method === "cod"}
                icon={<Banknote className="h-5 w-5" />}
                title="Cash on Delivery"
                description="Pay in cash when your order arrives."
              />
              <PaymentOption
                value="upi"
                selected={form.payment_method === "upi"}
                icon={<Smartphone className="h-5 w-5" />}
                title="UPI"
                description="Pay via UPI and upload payment screenshot after placing order."
              />
            </RadioGroup>
            {form.payment_method === "upi" && (
              <div className="mt-4 space-y-4 rounded-xl bg-accent/60 p-4">
                <div className="text-center space-y-3">
                  <p className="text-sm font-medium text-foreground">Scan QR or use UPI ID</p>
                  <div className="grid place-items-center">
                    <div className="w-48 h-48 bg-white rounded-xl border border-border grid place-items-center">
                      <p className="text-xs text-muted-foreground">QR Code Here</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-sm text-muted-foreground">UPI ID:</p>
                    <code className="bg-background px-2 py-1 rounded text-sm font-mono">{SITE.upi.id}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(SITE.upi.id);
                        toast.success("UPI ID copied!");
                      }}
                    >
                      <span className="sr-only">Copy UPI ID</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="rounded-2xl border bg-card p-6 shadow-card-soft lg:sticky lg:top-24 lg:h-fit">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>
          <ul className="mt-4 divide-y">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 py-3">
                <div className="grid h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-subtle-gradient">
                  <img src={resolveProductImage(item.imageKey)} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qty {item.quantity} × {formatPrice(item.priceCents)}</p>
                </div>
                <p className="text-sm font-semibold">{formatPrice(item.priceCents * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="text-success">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display text-xl font-bold">{formatPrice(total)}</dd>
            </div>
          </dl>
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</> : `Place order — ${formatPrice(total)}`}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            By placing this order you accept our replacement and refund policies.
          </p>
        </aside>
      </form>
    </div>
  );
}

function PaymentOption({
  value,
  selected,
  icon,
  title,
  description,
}: {
  value: string;
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <label
      htmlFor={`pay-${value}`}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors",
        selected ? "border-primary bg-accent/60" : "border-border hover:border-primary/40",
      )}
    >
      <RadioGroupItem value={value} id={`pay-${value}`} className="mt-1" />
      <div className="flex-1">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
          {title}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}
