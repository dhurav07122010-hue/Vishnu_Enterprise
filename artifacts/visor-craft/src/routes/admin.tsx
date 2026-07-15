import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Package, ShoppingCart, MessageSquare, Mail, Settings, Home, LogOut, Images, Layers, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRequireAdmin } from "@/lib/require-auth";
import { adminLogout } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const isReady = useRequireAdmin();
  const navigate = useNavigate();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Checking access…</div>
      </div>
    );
  }

  function handleLogout() {
    adminLogout();
    void navigate({ to: "/admin-login" });
  }

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-elegant">
              <span className="text-sm font-bold font-display">VE</span>
            </div>
            <div>
              <p className="font-display font-bold text-sm leading-tight">Vishnu Admin</p>
              <p className="text-xs text-muted-foreground">Control Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <NavItem to="/admin" icon={<Home className="h-4 w-4" />} label="Dashboard" exact />
          <NavItem to="/admin/products" icon={<Package className="h-4 w-4" />} label="Products" />
          <NavItem to="/admin/categories" icon={<Layers className="h-4 w-4" />} label="Main Categories" />
          <NavItem to="/admin/subcategories" icon={<Tag className="h-4 w-4" />} label="Subcategories" />
          <NavItem to="/admin/slider" icon={<Images className="h-4 w-4" />} label="Hero Slider" />
          <NavItem to="/admin/orders" icon={<ShoppingCart className="h-4 w-4" />} label="Orders" />
          <NavItem to="/admin/messages" icon={<MessageSquare className="h-4 w-4" />} label="Messages" />
          <NavItem to="/admin/newsletter" icon={<Mail className="h-4 w-4" />} label="Newsletter" />
          <NavItem to="/admin/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
        </nav>

        <div className="p-4 border-t space-y-1">
          <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Store
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="overflow-auto bg-muted/20">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  exact,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  exact?: boolean;
}) {
  return (
    <Button asChild variant="ghost" className="w-full justify-start">
      <Link
        to={to}
        activeProps={{ className: "bg-accent text-accent-foreground" }}
        activeOptions={{ exact }}
      >
        {icon}
        <span className="ml-3">{label}</span>
      </Link>
    </Button>
  );
}
