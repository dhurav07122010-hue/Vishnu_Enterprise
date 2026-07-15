import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SliderItem } from "@/lib/sliders";
import heroImage from "@/assets/hero-visor.jpg";

// ── Fallback static slide (shown when no slides are configured) ──────────────

function StaticHero() {
  return (
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
            Mirror, tinted and crystal-clear visors. Delivered locally across Delhi by Vishnu Enterprises. Cash on Delivery and UPI supported.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-elegant">
              <Link to="/store">Shop Now <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-navy-foreground/30 bg-transparent text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground">
              <Link to="/track">Track Order</Link>
            </Button>
          </div>
          <dl className="grid max-w-md grid-cols-3 gap-6 pt-4">
            {[{ k: "10K+", v: "Riders served" }, { k: "4.7★", v: "Avg. rating" }, { k: "48 hr", v: "Local delivery" }].map((s) => (
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
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}

// ── Dynamic slider ───────────────────────────────────────────────────────────

interface HeroSliderProps {
  slides: SliderItem[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  if (slides.length === 0) return <StaticHero />;

  return <DynamicSlider slides={slides} />;
}

function DynamicSlider({ slides }: { slides: SliderItem[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  // Track selected index
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  // Auto-play every 5 seconds, pause on hover
  useEffect(() => {
    if (!emblaApi || isPaused) return;
    const id = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(id);
  }, [emblaApi, isPaused]);

  return (
    <section
      className="relative overflow-hidden bg-hero-gradient text-navy-foreground"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Embla viewport */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {slides.map((slide) => (
            <Slide key={slide.id} slide={slide} />
          ))}
        </div>
      </div>

      {/* Prev / Next arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-navy-foreground/10 backdrop-blur-sm transition hover:bg-navy-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6 sm:h-12 sm:w-12"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollNext}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-navy-foreground/10 backdrop-blur-sm transition hover:bg-navy-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6 sm:h-12 sm:w-12"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                i === selectedIndex ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Slide({ slide }: { slide: SliderItem }) {
  const hasImage = !!slide.image_url;

  return (
    <div className="min-w-0 flex-[0_0_100%]">
      <div className="container-page grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div className="space-y-6">
          {slide.subtitle && (
            <span className="inline-flex items-center gap-2 rounded-full border border-navy-foreground/20 bg-navy-foreground/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-navy-foreground/80">
              <Sparkles className="h-3.5 w-3.5" /> {slide.subtitle}
            </span>
          )}
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-primary-glow to-white bg-clip-text text-transparent">
              {slide.title}
            </span>
          </h1>
          {slide.description && (
            <p className="max-w-lg text-base text-navy-foreground/75 sm:text-lg">
              {slide.description}
            </p>
          )}
          {slide.button_text && (
            <div className="flex flex-wrap gap-3">
              {slide.button_link?.startsWith("http") ? (
                <a href={slide.button_link} className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-navy shadow-elegant transition hover:bg-white/90">
                  {slide.button_text} <ArrowRight className="h-4 w-4" />
                </a>
              ) : (
                <Button asChild size="lg" className="shadow-elegant bg-white text-navy hover:bg-white/90">
                  <Link to={(slide.button_link as any) ?? "/store"}>
                    {slide.button_text} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <div className="absolute -inset-8 rounded-full bg-primary/30 blur-3xl" aria-hidden />
          {hasImage ? (
            <img
              src={slide.image_url}
              alt={slide.title}
              className="relative w-full rounded-3xl shadow-elegant object-cover max-h-[480px]"
              loading="lazy"
            />
          ) : (
            <img
              src={heroImage}
              alt={slide.title}
              className="relative w-full rounded-3xl shadow-elegant"
              loading="lazy"
            />
          )}
        </div>
      </div>
    </div>
  );
}
