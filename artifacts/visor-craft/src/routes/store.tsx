import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ProductCard } from "@/components/site/product-card";
import { categoriesQuery, productsQuery } from "@/lib/products";
import { formatPrice } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "Shop Helmet Visors — Vishnu Enterprises" },
      {
        name: "description",
        content:
          "Browse premium mirror, tinted and clear helmet visors from Vishnu Enterprises. Delhi-wide delivery, COD and UPI accepted.",
      },
      { property: "og:title", content: "Shop Helmet Visors — Vishnu Enterprises" },
      {
        property: "og:description",
        content: "Mirror, tinted and clear helmet visors. Shop online — COD and UPI accepted.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]);
  },
  component: StorePage,
});

function StorePage() {
  const { data: products } = useSuspenseQuery(productsQuery());
  const { data: categories } = useSuspenseQuery(categoriesQuery());

  const maxPrice = useMemo(
    () => Math.max(...products.map((p) => p.price_cents), 100000),
    [products],
  );

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [price, setPrice] = useState<[number, number]>([0, maxPrice]);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (cat && p.category_id !== cat) return false;
      if (p.price_cents < price[0] || p.price_cents > price[1]) return false;
      if (q && !`${p.name} ${p.short_description ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, cat, price]);

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">All visors</h1>
        <p className="mt-2 text-muted-foreground">
          {filtered.length} of {products.length} products
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside
          className={cn(
            "space-y-6 rounded-2xl border bg-card p-5 shadow-card-soft lg:sticky lg:top-24 lg:h-fit",
            !showFilters && "hidden lg:block",
          )}
        >
          <div>
            <label className="mb-2 block text-sm font-semibold">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search visors…"
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Category</p>
            <div className="space-y-1.5">
              <button
                onClick={() => setCat(null)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  !cat ? "bg-accent font-medium text-accent-foreground" : "hover:bg-accent/60",
                )}
              >
                All categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    cat === c.id ? "bg-accent font-medium text-accent-foreground" : "hover:bg-accent/60",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">Price range</p>
            <Slider
              min={0}
              max={maxPrice}
              step={1000}
              value={price}
              onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])}
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{formatPrice(price[0])}</span>
              <span>{formatPrice(price[1])}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setQuery("");
              setCat(null);
              setPrice([0, maxPrice]);
            }}
          >
            Clear filters
          </Button>
        </aside>

        <div>
          <Button
            variant="outline"
            className="mb-4 w-full lg:hidden"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? "Hide filters" : "Filters"}
          </Button>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
              No visors match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
