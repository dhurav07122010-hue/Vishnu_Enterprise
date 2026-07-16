import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/policies/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy | Vishnu Enterprises — Helmet Visors Delhi" },
      {
        name: "description",
        content:
          "Read the refund policy for Vishnu Enterprises helmet visor orders. Understand our no-refund policy and when replacements apply.",
      },
      { property: "og:title", content: "Refund Policy | Vishnu Enterprises" },
      { property: "og:description", content: "Refund policy for helmet visor orders placed with Vishnu Enterprises, Delhi." },
      { property: "og:url", content: "https://www.virgovisor.com/policies/refund" },
    ],
    links: [{ rel: "canonical", href: "https://www.virgovisor.com/policies/refund" }],
  }),
  component: RefundPolicy,
});

function RefundPolicy() {
  return (
    <div className="container-page prose prose-slate max-w-3xl py-16">
      <h1 className="font-display text-3xl font-bold">Refund Policy</h1>
      <p className="mt-2 text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
      <ul className="mt-6 space-y-3 text-foreground/85">
        <li>No refunds are provided after an order is confirmed.</li>
        <li>Eligible issues such as damage, defect or wrong items are resolved through <strong>replacement only</strong>, per our Replacement Policy.</li>
        <li>By placing an order you accept this policy.</li>
      </ul>
      <div className="mt-8 flex gap-3">
        <Button asChild><Link to="/policies/replacement">Replacement policy</Link></Button>
        <Button asChild variant="outline"><Link to="/contact">Contact us</Link></Button>
      </div>
    </div>
  );
}
