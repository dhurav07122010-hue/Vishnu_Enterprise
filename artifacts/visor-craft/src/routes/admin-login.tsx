import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin, isAdminLoggedIn } from "@/lib/admin-auth";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin-login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdminLoggedIn()) {
      void navigate({ to: "/admin" });
    }
  }, [navigate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Small delay for UX feedback
    setTimeout(() => {
      const success = adminLogin(username, password);
      setLoading(false);
      if (success) {
        toast.success("Welcome to Admin Panel!");
        void navigate({ to: "/admin" });
      } else {
        toast.error("Invalid username or password");
        setPassword("");
      }
    }, 400);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border bg-card p-10 shadow-card-soft">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-elegant">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold">Admin Access</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Vishnu Enterprises Control Panel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full shadow-elegant" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
              ) : (
                "Sign In to Admin"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to store
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
