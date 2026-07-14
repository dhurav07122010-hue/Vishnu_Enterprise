import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const queryClient = useQueryClient();

  // Read from the local Supabase session (localStorage) — instant, no network.
  // onAuthStateChange in init-auth.ts keeps this cache in sync for the lifetime
  // of the tab, so we never need to re-fetch.
  const userQuery = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.user ?? null;
    },
    // Never automatically re-fetch — only updated via setQueryData from
    // onAuthStateChange. This prevents the "flash of unauthenticated" on reload.
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // After Google redirects back, Supabase extracts the token and fires
        // onAuthStateChange(SIGNED_IN). The listener in init-auth.ts then seeds
        // the cache so the user is instantly recognised.
        redirectTo: window.location.origin,
        queryParams: {
          // Ask Google for refresh-token access so the session can be renewed
          // without the user having to re-authenticate.
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // onAuthStateChange fires SIGNED_IN → cache is updated automatically
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange fires SIGNED_OUT → cache is cleared automatically
  };

  return {
    user: userQuery.data ?? null,
    isLoading: userQuery.isLoading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
