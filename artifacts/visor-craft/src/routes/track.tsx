import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PackageSearch, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSiteInfo } from "@/lib/site-settings";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track your order — Vishnu Enterprises" },
      { name: "description", content: "Track your Vishnu Enterprises helmet visor order using your order number." },
      { property: "og:title", content: "Track your order — Vishnu Enterprises" },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const navigate = useNavigate();
  const site = useSiteInfo();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = orderNumber.trim().toUpperCase();
    if (!/^VE-\d{6}-\d{5}$/.test(trimmed)) {
      toast.error("Order numbers look like VE-YYMMDD-XXXXX");
      return;
    }
    navigate({ to: "/orders/$orderNumber", params: { orderNumber: trimmed } });
  }

  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-xl rounded-3xl border bg-card p-8 shadow-card-soft sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground">
          <PackageSearch className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-center font-display text-3xl font-bold">Track your order</h1>
        <p className="mt-2 text-center text-muted-foreground">
          Enter the order number we sent you to see live status.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="order-number">Order number</Label>
            <Input
              id="order-number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="VE-260712-00042"
              className="h-12 font-mono uppercase tracking-wider"
              autoComplete="off"
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            Track order <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Lost your order number? WhatsApp us at{" "}
          <a href={`https://wa.me/${site.whatsapp}`} className="font-medium text-primary hover:underline">
            {site.phone}
          </a>
        </p>
      </div>
    </div>
  );
}
