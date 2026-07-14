import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { FloatingActions } from "./floating";
import { Toaster } from "@/components/ui/sonner";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <FloatingActions />
        <Toaster position="top-right" richColors closeButton />
      </div>
    </ThemeProvider>
  );
}
