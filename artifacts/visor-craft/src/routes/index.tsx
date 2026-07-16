import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Truck,
  ShieldCheck,
  Sparkles,
  Mail,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/site/product-card";
import { Rating } from "@/components/site/rating";
import { ScrollReveal, ScrollRevealItem } from "@/components/site/scroll-reveal";
import { productsQuery } from "@/lib/products";
import { slidesQuery } from "@/lib/sliders";
import { HeroSlider } from "@/components/site/hero-slider";
import { SITE } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useSiteInfo } from "@/lib/site-settings";

/** Best-effort client-side sync of the browser tab title/description from Admin → Settings.
 * Only applied on the homepage, which has no route-level `head()` override of its own. */
function useHomeMetaSync() {
  const site = useSiteInfo();

  useEffect(() => {
    document.title = site.metaTitle;

    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    setMeta("description", site.metaDescription);
    if (site.metaKeywords) setMeta("keywords", site.metaKeywords);
  }, [site.metaTitle, site.metaDescription, site.metaKeywords]);
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Helmet Visors Online | Premium Helmet Visors India | Vishnu Enterprises" },
      {
        name: "description",
        content:
          "Buy premium helmet visors online from Vishnu Enterprises. High-quality helmet visors, bike helmet visors, replacement visors, and motorcycle visor accessories with pan-India delivery.",
      },
      {
        name: "keywords",
        content:
          "Helmet Visors, Helmet Visor, Bike Helmet Visor, Motorcycle Visor, Helmet Accessories, Helmet Shield, Helmet Face Shield, Replacement Helmet Visor, Helmet Glass, Helmet Screen, Riding Accessories, Buy Helmet Visor Online India, Helmet Visors India, Vishnu Enterprises",
      },
      { property: "og:title", content: "Helmet Visors Online | Premium Helmet Visors India | Vishnu Enterprises" },
      {
        property: "og:description",
        content:
          "Buy premium helmet visors online from Vishnu Enterprises. Mirror, tinted and clear visors for motorcycles. Fast pan-India delivery.",
      },
      { property: "og:url", content: "https://www.virgovisor.com/" },
      { property: "og:image", content: "https://www.virgovisor.com/og-logo.jpeg" },
      { name: "twitter:title", content: "Premium Helmet Visors | Pan-India Delivery | Vishnu Enterprises" },
      {
        name: "twitter:description",
        content: "Mirror, tinted and clear motorcycle visors. Delivered across India.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.virgovisor.com/" }],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsQuery()),
      context.queryClient.ensureQueryData(slidesQuery()),
    ]);
  },
  component: HomePage,
});

const perks = [
  { icon: BadgeCheck, title: "Premium build", body: "Optical-grade polycarbonate with hard coat." },
  { icon: Truck, title: "All India delivery", body: "Shipped across India — COD and UPI accepted everywhere." },
  { icon: ShieldCheck, title: "4-day replacement", body: "Damaged or wrong item? We swap it fast." },
  { icon: Sparkles, title: "Fits most helmets", body: "Universal fit for popular full-face helmets." },
];

const testimonials = [
  { name: "Rahul S.", city: "Delhi", body: "The blue mirror looks incredible in sunlight. Perfect fit and quick delivery." },
  { name: "Priya K.", city: "Noida", body: "Riding at noon is finally comfortable. Great tint, no distortion." },
  { name: "Manish D.", city: "Gurugram", body: "Best clear visor I've owned — zero fogging in winter mornings." },
];

const homeFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Are your helmet visors compatible with most motorcycle helmets?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Our visors are designed for a universal fit and are compatible with most popular full-face motorcycle helmets in India, including Vega, Steelbird, LS2, and more." },
    },
    {
      "@type": "Question",
      "name": "What types of helmet visors do you sell?",
      "acceptedAnswer": { "@type": "Answer", "text": "We stock mirror visors, tinted visors, and clear visors — all made from optical-grade polycarbonate with a hard coating for scratch resistance." },
    },
    {
      "@type": "Question",
      "name": "Do you deliver helmet visors all over India?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes! We deliver across all of India — Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad, and every other city and town. COD and UPI accepted everywhere." },
    },
    {
      "@type": "Question",
      "name": "Can I replace my old helmet visor myself?",
      "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. Our visors are designed for easy DIY replacement — most can be swapped in under 5 minutes without any special tools." },
    },
    {
      "@type": "Question",
      "name": "What payment methods do you accept?",
      "acceptedAnswer": { "@type": "Answer", "text": "We accept Cash on Delivery (COD) and UPI payments for all orders." },
    },
    {
      "@type": "Question",
      "name": "What is your replacement policy?",
      "acceptedAnswer": { "@type": "Answer", "text": "We offer a 4-day replacement guarantee on damaged, defective, or wrong items. Reach out within 4 days of delivery and we'll arrange a swap." },
    },
  ],
};

function HomePage() {
  const { data: products } = useSuspenseQuery(productsQuery());
  const { data: slides } = useSuspenseQuery(slidesQuery());
  const featured = products.filter((p) => p.is_featured).slice(0, 4);
  const site = useSiteInfo();
  useHomeMetaSync();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd) }} />
      {/* Hero — dynamic slider (falls back to static hero when no slides configured) */}
      <HeroSlider slides={slides} />

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
              Why {site.name}
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
            Loved by riders across India
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

      {/* Pan-India service area */}
      <section className="bg-subtle-gradient py-16 md:py-24">
        <div className="container-page">
          <ScrollReveal className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Serving All India</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Helmet Visors Delivered Across India
            </h2>
            <p className="mt-4 text-muted-foreground">
              Vishnu Enterprises ships premium motorcycle helmet visors, bike visors, and riding accessories to every corner of India — North, South, East, and West. COD and UPI accepted.
            </p>
          </ScrollReveal>
          <ScrollReveal group className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { area: "North India", desc: "Delhi, Noida, Gurugram, Lucknow, Jaipur, Chandigarh and all major North Indian cities." },
              { area: "West & Central India", desc: "Mumbai, Pune, Ahmedabad, Bhopal, Nagpur — fast delivery across Western and Central India." },
              { area: "South & East India", desc: "Bengaluru, Chennai, Hyderabad, Kolkata and all South and East Indian cities covered." },
            ].map(({ area, desc }) => (
              <ScrollRevealItem key={area}>
                <div className="rounded-2xl border bg-card p-6 shadow-card-soft">
                  <h3 className="font-display text-lg font-semibold text-foreground">{area}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page py-16 md:py-24">
        <ScrollReveal className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">FAQ</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </ScrollReveal>
        <ScrollReveal group className="mx-auto max-w-3xl divide-y divide-border">
          {[
            {
              q: "Are your helmet visors compatible with most motorcycle helmets?",
              a: "Yes. Our visors are designed for a universal fit and are compatible with most popular full-face motorcycle helmets available in India, including brands like Vega, Steelbird, LS2, and more.",
            },
            {
              q: "What types of helmet visors do you sell?",
              a: "We stock mirror visors, tinted visors, and clear visors — all made from optical-grade polycarbonate with a hard coating for scratch resistance.",
            },
            {
              q: "Do you deliver helmet visors all over India?",
              a: "Yes! We deliver across all of India — Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad, and every other city and town. COD and UPI accepted everywhere.",
            },
            {
              q: "Can I replace my old helmet visor myself?",
              a: "Absolutely. Our visors are designed for easy DIY replacement — most can be swapped in under 5 minutes without any special tools.",
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept Cash on Delivery (COD) and UPI payments for all orders.",
            },
            {
              q: "What is your replacement policy?",
              a: "We offer a 4-day replacement guarantee on damaged, defective, or wrong items. Simply reach out within 4 days of delivery and we'll arrange a swap.",
            },
          ].map(({ q, a }) => (
            <ScrollRevealItem key={q}>
              <details className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-foreground list-none">
                  <span>{q}</span>
                  <span className="ml-4 shrink-0 text-primary transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
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
