import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Check, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/site/rating";
import { ProductCard } from "@/components/site/product-card";
import { productsQuery, reviewsQuery } from "@/lib/products";
import { formatPrice, SITE } from "@/lib/site";
import { resolveProductImage } from "@/lib/product-images";
import { cart } from "@/lib/cart";
import { wishlist, useIsInWishlist } from "@/lib/wishlist";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const products = await context.queryClient.ensureQueryData(productsQuery());
    const product = products.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    await context.queryClient.ensureQueryData(reviewsQuery(product.id));
    return { productId: product.id, product };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found — Vishnu Enterprises" }, { name: "robots", content: "noindex" }] };
    }
    const product = loaderData.product;
    const title = `${product.name} — Vishnu Enterprises`;
    const description = product.short_description || `Buy ${product.name} from Vishnu Enterprises. COD & UPI accepted.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
      ],
      links: [],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Product not found</h1>
      <p className="mt-2 text-muted-foreground">This visor doesn't exist or was removed.</p>
      <Button asChild className="mt-6">
        <Link to="/store">Back to store</Link>
      </Button>
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: products } = useSuspenseQuery(productsQuery());
  const product = products.find((p) => p.slug === slug)!;
  const { data: reviews } = useSuspenseQuery(reviewsQuery(product.id));
  const isWishlisted = useIsInWishlist(product.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.short_description || product.description,
    "image": [resolveProductImage(product.primary_image_url)],
    "brand": {
      "@type": "Organization",
      "name": SITE.name
    },
    "offers": {
      "@type": "Offer",
      "url": `https://example.com/products/${product.slug}`,
      "priceCurrency": "INR",
      "price": product.price_cents / 100,
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.rating_count
    }
  };

  const [qty, setQty] = useState(1);
  const image = resolveProductImage(product.primary_image_url);
  const inStock = product.stock > 0;
  const related = products.filter((p) => p.category_id === product.category_id && p.id !== product.id).slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container-page py-8 md:py-12">
        <Link to="/store" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to store
        </Link>

        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border bg-subtle-gradient shadow-card-soft">
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              width={1024}
              height={1024}
              className="aspect-square w-full object-cover"
            />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{product.name}</h1>
              <div className="mt-3 flex items-center gap-4">
                <Rating value={product.rating} count={product.rating_count} size="md" />
                {inStock ? (
                  <Badge className="bg-success text-success-foreground">In stock</Badge>
                ) : (
                  <Badge variant="secondary">Out of stock</Badge>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold">{formatPrice(product.price_cents)}</span>
              {product.compare_at_price_cents && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.compare_at_price_cents)}
                </span>
              )}
            </div>

            <p className="text-base text-foreground/80">{product.description ?? product.short_description}</p>

            {Object.keys(product.specs ?? {}).length > 0 && (
              <div className="rounded-2xl border bg-card p-5">
                <h3 className="mb-3 font-semibold">Specifications</h3>
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-border/50 py-1.5 last:border-0">
                      <dt className="text-muted-foreground capitalize">{k}</dt>
                      <dd className="font-medium text-foreground">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-xl border bg-card">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-sm font-semibold" aria-live="polite">{qty}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="lg"
                className="flex-1"
                disabled={!inStock}
                onClick={() => {
                  cart.add(
                    {
                      productId: product.id,
                      slug: product.slug,
                      name: product.name,
                      priceCents: product.price_cents,
                      imageKey: product.primary_image_url,
                      stock: product.stock,
                    },
                    qty,
                  );
                  toast.success("Added to cart", {
                    description: `${qty} × ${product.name}`,
                  });
                }}
              >
                <ShoppingBag className="h-4 w-4" /> Add to Cart
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  wishlist.toggle({
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    priceCents: product.price_cents,
                    imageKey: product.primary_image_url,
                  });
                  toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist", {
                    description: product.name,
                  });
                }}
              >
                <Heart className={isWishlisted ? "fill-primary text-primary" : "text-muted-foreground"} />
              </Button>
            </div>

            <ul className="grid gap-2 pt-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Local Delhi delivery in 48 hours</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> 4-day replacement on damaged/wrong items</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Cash on Delivery and UPI supported</li>
            </ul>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Customer reviews</h2>
          {reviews.length === 0 ? (
            <p className="mt-3 text-muted-foreground">No reviews yet — be the first to try it!</p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {reviews.map((r) => (
                <article key={r.id} className="rounded-2xl border bg-card p-5 shadow-card-soft">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{r.customer_name}</p>
                    <Rating value={r.rating} />
                  </div>
                  {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                  {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold">Related visors</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
