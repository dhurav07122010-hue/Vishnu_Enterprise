import { createFileRoute, Link } from "@tanstack/react-router";
import { POLICY } from "@/lib/site";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/policies/replacement")({
  head: () => ({
    meta: [
      { title: "Replacement Policy | Helmet Visor Replacement Delhi | Vishnu Enterprises" },
      {
        name: "description",
        content: `${POLICY.replacementDays}-day replacement guarantee on damaged, defective or wrong helmet visors from Vishnu Enterprises, Delhi. Easy hassle-free process.`,
      },
      { property: "og:title", content: "Replacement Policy | Vishnu Enterprises" },
      { property: "og:description", content: `${POLICY.replacementDays}-day helmet visor replacement guarantee. Fast, hassle-free process across India.` },
      { property: "og:url", content: "https://www.virgovisor.com/policies/replacement" },
    ],
    links: [{ rel: "canonical", href: "https://www.virgovisor.com/policies/replacement" }],
  }),
  component: ReplacementPolicy,
});

function ReplacementPolicy() {
  return (
    <div className="container-page prose prose-slate max-w-3xl py-16">
      <h1 className="font-display text-3xl font-bold">Replacement Policy</h1>
      <p className="mt-2 text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
      <ul className="mt-6 space-y-3 text-foreground/85">
        <li>Replacement is available within <strong>{POLICY.replacementDays} days</strong> of delivery.</li>
        <li>The product must be <strong>unused</strong> and in its <strong>original packaging</strong>.</li>
        <li>Replacements are applicable only for <strong>damaged, defective, or incorrect</strong> products.</li>
        <li>Contact us with your Order ID and clear photos of the issue to raise a replacement request.</li>
      </ul>
      <div className="mt-8 flex gap-3">
        <Button asChild><Link to="/contact">Raise a replacement</Link></Button>
        <Button asChild variant="outline"><Link to="/policies/refund">Refund policy</Link></Button>
      </div>
    </div>
  );
}
