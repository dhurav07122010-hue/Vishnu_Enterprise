import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, ChevronRight, ArrowLeft, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ProductCard } from "@/components/site/product-card";
import { allCategoriesQuery, productsQuery } from "@/lib/products";
import { formatPrice } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/store")({
  validateSearch: (search: Record<string, unknown>) => ({
    main: typeof search.main === "string" ? search.main : undefined,
    sub: typeof search.sub === "string" ? search.sub : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Buy Helmet Visors Online India | Helmet Visor Shop | Vishnu Enterprises" },
      {
        name: "description",
        content:
          "Shop premium helmet visors online — mirror, tinted and clear bike visors for motorcycle helmets. Pan-India delivery, COD and UPI accepted. Vishnu Enterprises.",
      },
      {
        name: "keywords",
        content:
          "buy helmet visor online India, helmet visor shop online, motorcycle visor India, bike helmet visor, helmet accessories India, helmet shield, replacement visor India",
      },
      { property: "og:title", content: "Buy Helmet Visors Online India | Vishnu Enterprises" },
      {
        property: "og:description",
        content: "Mirror, tinted and clear motorcycle visors. Shop online with pan-India delivery — COD and UPI accepted.",
      },
      { property: "og:url", content: "https://www.virgovisor.com/store" },
      { property: "og:image", content: "https://www.virgovisor.com/og-logo.jpeg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Buy Helmet Visors Online India | Vishnu Enterprises" },
      { name: "twitter:description", content: "Mirror, tinted and clear motorcycle visors. Pan-India delivery, COD & UPI." },
      { name: "twitter:image", content: "https://www.virgovisor.com/og-logo.jpeg" },
    ],
    links: [{ rel: "canonical", href: "https://www.virgovisor.com/store" }],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsQuery()),
      context.queryClient.ensureQueryData(allCategoriesQuery()),
    ]);
  },
  component: StorePage,
});

function StorePage() {
  const navigate = useNavigate({ from: "/store" });
  const { main: mainId, sub: subId } = Route.useSearch();

  const { data: products } = useSuspenseQuery(productsQuery());
  const { data: allCategories } = useSuspenseQuery(allCategoriesQuery());

  // Split into main vs sub categories
  const mainCategories = useMemo(
    () => allCategories.filter((c) => !c.parent_id && c.is_visible !== false),
    [allCategories],
  );

  const selectedMain = mainId ? allCategories.find((c) => c.id === mainId) : null;
  const selectedSub = subId ? allCategories.find((c) => c.id === subId) : null;

  // Subcategories for the selected main category
  const subcategories = useMemo(
    () =>
      mainId
        ? allCategories.filter((c) => c.parent_id === mainId && c.is_visible !== false)
        : [],
    [allCategories, mainId],
  );

  // --- Product grid state (only used in products view) ---
  const maxPrice = useMemo(
    () => Math.max(...products.map((p) => p.price_cents), 100000),
    [products],
  );
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState<[number, number]>([0, maxPrice]);
  const [showFilters, setShowFilters] = useState(false);

  // Products filtered to the selected subcategory
  const filteredProducts = useMemo(() => {
    if (!subId) return [];
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (p.category_id !== subId) return false;
      if (p.price_cents < price[0] || p.price_cents > price[1]) return false;
      if (q && !`${p.name} ${p.short_description ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, subId, query, price]);

  // ── View: Main category grid ──────────────────────────────────────────────
  if (!mainId) {
    return (
      <div className="container-page py-10 md:py-14">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Shop</h1>
          <p className="mt-2 text-muted-foreground">Browse our collections</p>
        </header>

        {mainCategories.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed p-20 text-center text-muted-foreground">
            <LayoutGrid className="mx-auto mb-4 h-10 w-10 opacity-30" />
            <p>No categories configured yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {mainCategories.map((cat) => {
              const catSubs = allCategories.filter((c) => c.parent_id === cat.id);
              const catSubIds = new Set(catSubs.map((c) => c.id));
              const productCount = products.filter((p) => p.category_id && catSubIds.has(p.category_id)).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate({ search: { main: cat.id } })}
                  className="group rounded-2xl overflow-hidden border bg-card shadow-card-soft hover:shadow-elevated transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative h-48 bg-gradient-to-br from-primary/15 via-primary/5 to-background overflow-hidden">
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-8xl font-bold text-primary/10 select-none font-display">
                          {cat.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                      <span className="text-white/80 text-xs">
                        {catSubs.length > 0 && `${catSubs.length} ${catSubs.length === 1 ? "subcategory" : "subcategories"} · `}
                        {productCount} {productCount === 1 ? "product" : "products"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-white/70 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{cat.description}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── View: Subcategory grid ────────────────────────────────────────────────
  if (mainId && !subId) {
    return (
      <div className="container-page py-10 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <button onClick={() => navigate({ search: {} })} className="hover:text-foreground transition-colors">
            Shop
          </button>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{selectedMain?.name ?? "Category"}</span>
        </nav>

        <header className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate({ search: {} })}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border bg-card hover:bg-accent transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold">{selectedMain?.name}</h1>
            {selectedMain?.description && (
              <p className="mt-1 text-muted-foreground">{selectedMain.description}</p>
            )}
          </div>
        </header>

        {subcategories.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed p-20 text-center text-muted-foreground">
            <p>No subcategories in this category yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {subcategories.map((sub) => {
              const count = products.filter((p) => p.category_id === sub.id).length;
              return (
                <button
                  key={sub.id}
                  onClick={() => navigate({ search: { main: mainId, sub: sub.id } })}
                  className="group rounded-2xl overflow-hidden border bg-card shadow-card-soft hover:shadow-elevated transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {sub.image_url && (
                    <div className="h-32 overflow-hidden">
                      <img
                        src={sub.image_url}
                        alt={sub.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className={cn("p-4", !sub.image_url && "py-6")}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {sub.name}
                      </h3>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                    {sub.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{sub.description}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {count} {count === 1 ? "product" : "products"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── View: Product grid ────────────────────────────────────────────────────
  return (
    <div className="container-page py-10 md:py-14">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <button onClick={() => navigate({ search: {} })} className="hover:text-foreground transition-colors">
          Shop
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button
          onClick={() => navigate({ search: { main: mainId } })}
          className="hover:text-foreground transition-colors"
        >
          {selectedMain?.name ?? "Category"}
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{selectedSub?.name ?? "Products"}</span>
      </nav>

      <header className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate({ search: { main: mainId } })}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border bg-card hover:bg-accent transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-3xl font-bold">{selectedSub?.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {filteredProducts.length} of {products.filter((p) => p.category_id === subId).length} products
          </p>
        </div>
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
                placeholder="Search products…"
                className="pl-9"
              />
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

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
              No products match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
