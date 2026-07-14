import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cart, useCart, useCartSubtotal, SHIPPING_FEE_CENTS } from "@/lib/cart";
import { formatPrice } from "@/lib/site";
import { resolveProductImage } from "@/lib/product-images";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Vishnu Enterprises" },
      { name: "description", content: "Review the helmet visors in your cart and checkout with COD or UPI." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const items = useCart();
  const subtotal = useCartSubtotal();
  const shipping = items.length > 0 ? SHIPPING_FEE_CENTS : 0;
  const total = subtotal + shipping;
  const { user, signInWithGoogle } = useAuth();

  if (items.length === 0) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-lg rounded-3xl border bg-card p-10 text-center shadow-card-soft">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">
            Add a visor from the store and it'll show up here.
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link to="/store">Browse visors <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Your cart</h1>
        <p className="mt-2 text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.productId}
              className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-4 rounded-2xl border bg-card p-4 shadow-card-soft sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:gap-5"
            >
              <Link
                to="/products/$slug"
                params={{ slug: item.slug }}
                className="overflow-hidden rounded-xl border bg-subtle-gradient"
              >
                <img
                  src={resolveProductImage(item.imageKey)}
                  alt={item.name}
                  width={200}
                  height={200}
                  className="aspect-square w-full object-cover"
                />
              </Link>

              <div className="min-w-0">
                <Link
                  to="/products/$slug"
                  params={{ slug: item.slug }}
                  className="line-clamp-2 font-display text-base font-semibold text-foreground hover:text-primary"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{formatPrice(item.priceCents)} each</p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center rounded-xl border bg-background">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => cart.setQuantity(item.productId, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      disabled={item.quantity >= (item.stock || 99)}
                      onClick={() => cart.setQuantity(item.productId, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => cart.remove(item.productId)}
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>

              <div className="col-span-2 flex items-center justify-between border-t pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-none sm:pt-0 sm:text-right">
                <span className="text-xs uppercase tracking-wider text-muted-foreground sm:hidden">Line total</span>
                <span className="font-display text-lg font-bold text-foreground">
                  {formatPrice(item.priceCents * item.quantity)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <aside className="rounded-2xl border bg-card p-6 shadow-card-soft lg:sticky lg:top-24 lg:h-fit">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-medium text-success">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display text-xl font-bold">{formatPrice(total)}</dd>
            </div>
          </dl>
          {!user && (
            <Alert className="mt-4 border-warning bg-warning/5">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                Sign in to checkout and track your orders.
              </AlertDescription>
            </Alert>
          )}
          {user ? (
            <Button asChild size="lg" className="mt-6 w-full">
              <Link to="/checkout">Proceed to checkout <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          ) : (
            <Button onClick={signInWithGoogle} size="lg" className="mt-6 w-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign In with Google
            </Button>
          )}
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link to="/store">Continue shopping</Link>
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Cash on Delivery and UPI accepted. Delhi-wide delivery in 48 hours.
          </p>
        </aside>
      </div>
    </div>
  );
}
