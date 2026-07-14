import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Truck,
  ShieldCheck,
  Sparkles,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/site/product-card";
import { Rating } from "@/components/site/rating";
import { ScrollReveal, ScrollRevealItem } from "@/components/site/scroll-reveal";
import { productsQuery } from "@/lib/products";
import { SITE } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-visor.jpg";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery()),
  component: HomePage,
});

const perks = [
  { icon: BadgeCheck, title: "Premium build", body: "Optical-grade polycarbonate with hard coat." },
  { icon: Truck, title: "Local delivery", body: "Delivered across Delhi by our own team." },
  { icon: ShieldCheck, title: "4-day replacement", body: "Damaged or wrong item? We swap it fast." },
  { icon: Sparkles, title: "Fits most helmets", body: "Universal fit for popular full-face helmets." },
];

const testimonials = [
  { name: "Rahul S.", city: "Delhi", body: "The blue mirror looks incredible in sunlight. Perfect fit and quick delivery." },
  { name: "Priya K.", city: "Noida", body: "Riding at noon is finally comfortable. Great tint, no distortion." },
  { name: "Manish D.", city: "Gurugram", body: "Best clear visor I've owned — zero fogging in winter mornings." },
];

function HomePage() {
  const { data: products } = useSuspenseQuery(productsQuery());
  const featured = products.filter((p) => p.is_featured).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient text-navy-foreground">
        <div className="container-page grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-navy-foreground/20 bg-navy-foreground/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-navy-foreground/80">
              <Sparkles className="h-3.5 w-3.5" /> New season · 2026
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl">
              Premium helmet visors,{" "}
              <span className="bg-gradient-to-r from-primary-glow to-white bg-clip-text text-transparent">
                built for the road.
              </span>
            </h1>
            <p className="max-w-lg text-base text-navy-foreground/75 sm:text-lg">
              Mirror, tinted and crystal-clear visors. Delivered locally across Delhi by
              Vishnu Enterprises. Cash on Delivery and UPI supported.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-elegant">
                <Link to="/store">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"
              >
                <Link to="/track">Track Order</Link>
              </Button>
            </div>
            <dl className="grid max-w-md grid-cols-3 gap-6 pt-4">
              {[
                { k: "10K+", v: "Riders served" },
                { k: "4.7★", v: "Avg. rating" },
                { k: "48 hr", v: "Local delivery" },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-display text-2xl font-bold">{s.k}</dt>
                  <dd className="text-xs uppercase tracking-wider text-navy-foreground/60">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-primary/30 blur-3xl" aria-hidden />
            <img
              src={heroImage}
              alt="Premium motorcycle helmet with iridescent blue visor"
              width={1600}
              height={1100}
              className="relative w-full rounded-3xl shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container-page py-16 md:py-24">
        <ScrollReveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Featured
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Bestselling visors
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link to="/store">View all <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </ScrollReveal>
        <ScrollReveal group className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {featured.map((p) => (
            <ScrollRevealItem key={p.id}>
              <ProductCard product={p} />
            </ScrollRevealItem>
          ))}
        </ScrollReveal>
      </section>

      {/* Why choose us */}
      <section className="bg-subtle-gradient py-16 md:py-24">
        <div className="container-page">
          <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Why {SITE.name}
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              A visor you can trust, at a price that makes sense.
            </h2>
          </ScrollReveal>
          <ScrollReveal group className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map(({ icon: Icon, title, body }) => (
              <ScrollRevealItem key={title}>
                <div className="rounded-2xl border bg-card p-6 shadow-card-soft transition-shadow hover:shadow-elegant">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary-gradient text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* Reviews */}
      <section className="container-page py-16 md:py-24">
        <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Reviews
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Loved by riders across Delhi NCR
          </h2>
        </ScrollReveal>
        <ScrollReveal group className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <ScrollRevealItem key={t.name}>
              <figure className="rounded-2xl border bg-card p-6 shadow-card-soft">
                <Rating value={5} />
                <blockquote className="mt-4 text-sm text-foreground/80">"{t.body}"</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-foreground">{t.name}</span>
                  <span className="text-muted-foreground"> · {t.city}</span>
                </figcaption>
              </figure>
            </ScrollRevealItem>
          ))}
        </ScrollReveal>
      </section>

      {/* Newsletter */}
      <section className="container-page pb-16 md:pb-24">
        <ScrollReveal>
          <div className="overflow-hidden rounded-3xl bg-hero-gradient p-8 text-navy-foreground shadow-elegant sm:p-12">
            <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
              <div>
                <h2 className="font-display text-2xl font-bold sm:text-3xl">Get 10% off your first order</h2>
                <p className="mt-2 text-sm text-navy-foreground/70">
                  Subscribe for restock alerts and rider-only discounts.
                </p>
              </div>
              <NewsletterForm />
            </div>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.info("You're already subscribed. Thanks!");
      else toast.error("Couldn't subscribe. Try again.");
      return;
    }
    setEmail("");
    toast.success("Subscribed! Watch your inbox.");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <div className="relative flex-1">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-12 bg-card pl-9 text-foreground"
        />
      </div>
      <Button type="submit" size="lg" disabled={loading} className="h-12">
        {loading ? "Subscribing…" : "Subscribe"}
      </Button>
    </form>
  );
}
