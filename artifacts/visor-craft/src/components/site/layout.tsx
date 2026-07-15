import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { useRouterState } from "@tanstack/react-router";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { FloatingActions } from "./floating";
import { Toaster } from "@/components/ui/sonner";

export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="flex min-h-screen flex-col">
        {/* Admin pages render their own sidebar layout — the storefront
            navbar (with its "quick link" hamburger toggle) doesn't belong
            there and was overlapping/crowding the admin UI. */}
        {!isAdmin && <Navbar />}
        <main id="main" className="flex-1">
          {children}
        </main>
        {!isAdmin && <Footer />}
        <FloatingActions />
        <Toaster position="top-right" richColors closeButton />
      </div>
    </ThemeProvider>
  );
}
