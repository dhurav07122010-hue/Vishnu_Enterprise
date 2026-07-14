import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "./auth";
import { isAdminLoggedIn } from "./admin-auth";

/**
 * Redirect unauthenticated regular users to /login.
 * Used on user-facing protected pages (orders, etc.)
 */
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      void router.navigate({ to: "/login" });
    }
  }, [isLoading, user, router]);
}

/**
 * Redirect non-admin visitors to /admin-login.
 * Used on all admin/* pages.
 * Returns true when admin is confirmed, false while checking.
 */
export function useRequireAdmin(): boolean {
  const router = useRouter();
  const loggedIn = isAdminLoggedIn();

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      void router.navigate({ to: "/admin-login" });
    }
  }, [router]);

  return loggedIn;
}

export default useRequireAuth;
