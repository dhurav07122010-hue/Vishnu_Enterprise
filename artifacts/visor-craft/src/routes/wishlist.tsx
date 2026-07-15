
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductCard } from "@/components/site/product-card";
import { productsQuery } from "@/lib/products";
import { formatPrice } from "@/lib/site";
import { resolveProductImage } from "@/lib/product-images";
import { cart } from "@/lib/cart";
import { wishlist, useWishlist } from "@/lib/wishlist";

export const Route = createFileRoute("/wishlist")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(productsQuery());
  },
  head: () => ({
    meta: [
      { title: "Wishlist — Vishnu Enterprises" },
      {
        name: "description",
        content: "Your saved products from Vishnu Enterprises.",
      },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { data: allProducts } = useSuspenseQuery(productsQuery());
  const wishlistItems = useWishlist();

  const productsInWishlist = allProducts.filter((p) =>
    wishlistItems.some((item) => item.productId === p.id),
  );

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Your Wishlist</h1>
        <p className="mt-2 text-muted-foreground">
          {productsInWishlist.length === 0
            ? "No items in your wishlist yet."
            : `${productsInWishlist.length} item${productsInWishlist.length > 1 ? "s" : ""} saved`}
        </p>
      </header>

      {productsInWishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-10 text-center shadow-card-soft">
          <Heart className="mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="font-display text-xl font-bold">Your wishlist is empty</h2>
          <p className="mt-2 text-muted-foreground">
            Browse our products and save your favorites!
          </p>
          <Button asChild className="mt-6">
            <Link to="/store">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {productsInWishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
