import { Link } from "@tanstack/react-router";
import { ShoppingBag, Heart } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/site/rating";
import { formatPrice } from "@/lib/site";
import { resolveProductImage } from "@/lib/product-images";
import type { Product } from "@/lib/products";
import { cart } from "@/lib/cart";
import { wishlist, useIsInWishlist } from "@/lib/wishlist";

export function ProductCard({ product }: { product: Product }) {
  const image = resolveProductImage(product.primary_image_url);
  const inStock = product.stock > 0;
  const isWishlisted = useIsInWishlist(product.id);
  const discount =
    product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents
      ? Math.round(
          ((product.compare_at_price_cents - product.price_cents) /
            product.compare_at_price_cents) *
            100,
        )
      : null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-subtle-gradient"
        aria-label={product.name}
      >
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {discount ? (
          <Badge className="absolute left-3 top-3 bg-primary-gradient text-primary-foreground shadow-elegant">
            -{discount}%
          </Badge>
        ) : null}
        {!inStock && (
          <Badge variant="secondary" className="absolute right-3 top-3">
            Out of stock
          </Badge>
        )}
        <Button
          variant="outline"
          size="icon"
          className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-5">
        <div className="flex-1 space-y-1 sm:space-y-2">
          <Link
            to="/products/$slug"
            params={{ slug: product.slug }}
            className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors hover:text-primary sm:text-base"
          >
            {product.name}
          </Link>
          <Rating value={product.rating} count={product.rating_count} />
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold text-foreground sm:text-lg">
            {formatPrice(product.price_cents)}
          </span>
          {product.compare_at_price_cents && (
            <span className="text-xs text-muted-foreground line-through sm:text-sm">
              {formatPrice(product.compare_at_price_cents)}
            </span>
          )}
        </div>

        {/* Mobile: full-width cart button only; desktop: cart + view side by side */}
        <div className="flex gap-2">
          <Button
            className="flex-1 text-xs sm:text-sm"
            size="sm"
            disabled={!inStock}
            onClick={() => {
              cart.add({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                priceCents: product.price_cents,
                imageKey: product.primary_image_url,
                stock: product.stock,
              });
              toast.success("Added to cart", { description: product.name });
            }}
          >
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">Add to Cart</span>
            <span className="xs:hidden sm:hidden">Add</span>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden flex-1 text-xs sm:flex sm:text-sm">
            <Link to="/products/$slug" params={{ slug: product.slug }}>
              View
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
