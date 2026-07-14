import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, Phone, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Vishnu Enterprises — Helmet Visors, Delhi" },
      {
        name: "description",
        content:
          "Get in touch with Vishnu Enterprises. Call +91 79826 94772 or visit us in Johripur, North East Delhi.",
      },
      { property: "og:title", content: "Contact Vishnu Enterprises" },
      { property: "og:description", content: "Reach us via WhatsApp, phone, email or in-person in Delhi." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Invalid email").max(200),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().trim().max(150).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Please write a message").max(2000),
});

function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Please check the form");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    });
    setLoading(false);
    if (error) {
      toast.error("Couldn't send message. Please try again.");
      return;
    }
    toast.success("Message sent — we'll be in touch shortly!");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  }

  const mapQuery = encodeURIComponent(`${SITE.address.line1}, ${SITE.address.line2}, ${SITE.address.country}`);

  return (
    <div className="container-page py-12 md:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Contact</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">We'd love to hear from you</h1>
        <p className="mt-3 text-muted-foreground">
          Questions about a visor, bulk orders, or delivery in Delhi? Send a note and we'll reply the same day.
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border bg-card p-6 shadow-card-soft sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="c-name">Full name *</Label>
              <Input id="c-name" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="c-email">Email *</Label>
              <Input id="c-email" type="email" required maxLength={200} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="c-phone">Phone</Label>
              <Input id="c-phone" type="tel" maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="c-subject">Subject</Label>
              <Input id="c-subject" maxLength={150} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="c-message">Message *</Label>
            <Textarea id="c-message" required rows={5} maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
            <Send className="h-4 w-4" />
            {loading ? "Sending…" : "Send message"}
          </Button>
        </form>

        <div className="space-y-4">
          <div className="rounded-3xl border bg-card p-6 shadow-card-soft">
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold">Visit us</p>
                  <p className="text-muted-foreground">{SITE.address.line1}, {SITE.address.line2}, {SITE.address.country}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                  <Phone className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold">Call / WhatsApp</p>
                  <a href={`tel:${SITE.phone.replace(/\s+/g, "")}`} className="text-muted-foreground hover:text-primary">{SITE.phone}</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                  <Mail className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold">Email</p>
                  <a href={`mailto:${SITE.email}`} className="break-all text-muted-foreground hover:text-primary">{SITE.email}</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold">Business hours</p>
                  <p className="text-muted-foreground">{SITE.hours}</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-3xl border shadow-card-soft">
            <iframe
              title="Vishnu Enterprises location"
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              width="100%"
              height="280"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block w-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
