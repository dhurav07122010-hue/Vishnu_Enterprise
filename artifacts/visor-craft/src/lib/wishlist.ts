
import { useSyncExternalStore } from "react";

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  imageKey: string | null;
}

const STORAGE_KEY = "ve_wishlist_v1";
const listeners = new Set<() => void>();
let state: WishlistItem[] = [];
let hydrated = false;

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WishlistItem[];
      if (Array.isArray(parsed)) state = parsed;
    }
  } catch {
    state = [];
  }
  notify();
}

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void) {
  hydrate();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const EMPTY: WishlistItem[] = [];
const getSnapshot = () => (hydrated ? state : EMPTY);
const getServerSnapshot = () => EMPTY;

export function useWishlist() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsInWishlist(productId: string) {
  const wishlist = useWishlist();
  return wishlist.some((item) => item.productId === productId);
}

export function useWishlistCount() {
  const wishlist = useWishlist();
  return wishlist.length;
}

export const wishlist = {
  add(item: WishlistItem) {
    hydrate();
    const existing = state.find((i) => i.productId === item.productId);
    if (!existing) {
      state = [...state, item];
      persist();
      notify();
    }
  },
  remove(productId: string) {
    hydrate();
    state = state.filter((i) => i.productId !== productId);
    persist();
    notify();
  },
  toggle(item: WishlistItem) {
    hydrate();
    const existing = state.find((i) => i.productId === item.productId);
    if (existing) {
      state = state.filter((i) => i.productId !== item.productId);
    } else {
      state = [...state, item];
    }
    persist();
    notify();
  },
  clear() {
    state = [];
    persist();
    notify();
  },
  snapshot() {
    hydrate();
    return state;
  },
};
