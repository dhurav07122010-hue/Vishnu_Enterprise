import { QueryClient } from "@tanstack/react-query";
import { supabase } from "./client";

/**
 * Call once at the app root (inside a useEffect).
 *
 * 1. Immediately seeds the React Query cache from the persisted localStorage
 *    session so components see the user without a network round-trip.
 * 2. Subscribes to Supabase auth events for the lifetime of the app:
 *    - SIGNED_IN / TOKEN_REFRESHED → update cache + upsert profile
 *    - SIGNED_OUT                  → clear cache
 */
export function initSupabaseAuth(queryClient: QueryClient) {
  if (typeof window === "undefined") return () => {};

  // ── 1. Restore persisted session immediately (localStorage read, no network) ──
  supabase.auth.getSession().then(({ data }) => {
    const user = data.session?.user ?? null;
    queryClient.setQueryData(["currentUser"], user);
  }).catch((e) => console.error("[auth] Error restoring session:", e));

  // ── 2. Subscribe to all auth state changes ────────────────────────────────────
  const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
    const user = session?.user ?? null;

    // Keep the React Query cache in sync — this is the ONLY place we update it,
    // so every tab/window stays consistent without extra fetches.
    queryClient.setQueryData(["currentUser"], user);

    // On sign-in or token refresh, upsert the user's profile so their name,
    // email, and Google avatar are stored in our database.
    if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && user) {
      const meta = user.user_metadata ?? {};
      await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name:
              meta.full_name ??
              meta.name ??
              (user.email?.split("@")[0] ?? null),
            avatar_url: meta.avatar_url ?? meta.picture ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .then(({ error }) => {
          if (error) console.warn("[auth] Profile upsert failed:", error.message);
        });
    }

    if (event === "SIGNED_OUT") {
      // Invalidate any user-specific queries (orders, wishlist cache, etc.)
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  });

  return () => {
    sub?.subscription?.unsubscribe?.();
  };
}

export default initSupabaseAuth;
