import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-navy text-navy-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-gradient text-primary-foreground shadow-elegant">
              <span className="text-sm font-bold">VE</span>
            </span>
            <span className="font-display text-lg font-bold">{SITE.name}</span>
          </div>
          <p className="max-w-md text-sm text-navy-foreground/70">
            {SITE.description}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-navy-foreground/60">
            Shop
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/store" className="text-navy-foreground/80 hover:text-primary-foreground">All Visors</Link></li>
            <li><Link to="/track" className="text-navy-foreground/80 hover:text-primary-foreground">Track Order</Link></li>
            <li><Link to="/contact" className="text-navy-foreground/80 hover:text-primary-foreground">Contact Us</Link></li>
            <li><Link to="/policies/replacement" className="text-navy-foreground/80 hover:text-primary-foreground">Replacement Policy</Link></li>
            <li><Link to="/policies/refund" className="text-navy-foreground/80 hover:text-primary-foreground">Refund Policy</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-navy-foreground/60">
            Reach us
          </h3>
          <ul className="space-y-2 text-sm text-navy-foreground/80">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-glow" />
              <span>{SITE.address.line1}, {SITE.address.line2}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-primary-glow" />
              <a href={`tel:${SITE.phone.replace(/\s+/g, "")}`} className="hover:text-primary-foreground">
                {SITE.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-primary-glow" />
              <a href={`mailto:${SITE.email}`} className="hover:text-primary-foreground break-all">
                {SITE.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-navy-foreground/60 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <p>{SITE.hours}</p>
            <Link to="/admin-login" className="hover:text-navy-foreground/90 transition-colors">Admin Panel</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
