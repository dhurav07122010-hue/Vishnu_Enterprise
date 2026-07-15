import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, X, Heart, LogOut, Moon, Sun, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useCartCount } from "@/lib/cart";
import { useWishlistCount } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";

const links = [
  { to: "/", label: "Home" },
  { to: "/store", label: "Store" },
  { to: "/track", label: "Track Order" },
  { to: "/contact", label: "Contact" },
] as const;

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle dark mode"
      className="relative"
    >
      <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

/** Avatar circle — Google photo if available, otherwise initials */
function UserAvatar({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const avatarUrl = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  const name: string =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    "U";
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/30"
      />
    );
  }

  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground ring-2 ring-primary/30">
      {initials}
    </span>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const displayName: string =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70 transition-shadow duration-300",
        scrolled && "shadow-md",
      )}
    >
      <div className="container-page flex h-16 items-center gap-6">
        <Link to="/" className="flex shrink-0 items-center" aria-label={SITE.name}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-gradient text-primary-foreground shadow-elegant">
            <span className="text-sm font-bold">VE</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          {user && (
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/orders">My Orders</Link>
            </Button>
          )}

          {/* Wishlist */}
          <Button asChild variant="ghost" size="icon" aria-label={`Wishlist (${wishlistCount})`} className="relative">
            <Link to="/wishlist">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-elegant">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
          </Button>

          {/* Cart */}
          <Button asChild variant="ghost" size="icon" aria-label={`Cart (${cartCount})`} className="relative">
            <Link to="/cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-elegant">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </Button>

          {/* Dark / light mode toggle */}
          <ThemeToggle />

          {/* Auth — avatar + name + sign out when logged in */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2 pl-1">
              <UserAvatar user={user} />
              {displayName && (
                <span className="hidden lg:block max-w-[120px] truncate text-sm font-medium text-foreground">
                  {displayName.split(" ")[0]}
                </span>
              )}
              <Button
                onClick={() => { void signOut(); }}
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                title="Sign out"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/login">
                <User className="h-4 w-4 mr-1.5" />
                Sign In
              </Link>
            </Button>
          )}

          <Button asChild className="hidden lg:inline-flex">
            <Link to="/store">Shop Now</Link>
          </Button>

          {/* Menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Nav menu (Home / Store / Track Order / Contact + account links) */}
      <div className={cn("border-t border-border/60 bg-background", open ? "block" : "hidden")}>
        <nav className="container-page flex flex-col py-3">
          {/* Signed-in user info */}
          {user && (
            <div className="flex items-center gap-3 rounded-xl bg-accent/50 px-3 py-3 mb-1">
              <UserAvatar user={user} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{displayName || "My Account"}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          )}

          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              activeProps={{ className: "text-primary bg-accent" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/orders"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              My Orders
            </Link>
          )}
          <Link
            to="/wishlist"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Wishlist
          </Link>
          {user ? (
            <button
              onClick={() => { void signOut(); setOpen(false); }}
              className="rounded-lg px-3 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 text-left flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-primary transition-colors hover:bg-accent flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
