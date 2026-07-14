import { useSyncExternalStore } from "react";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  imageKey: string | null;
  quantity: number;
  stock: number;
}

const STORAGE_KEY = "ve_cart_v1";
const listeners = new Set<() => void>();
let state: CartItem[] = [];
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
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) state = parsed.filter((i) => i && i.productId && i.quantity > 0);
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

const EMPTY: CartItem[] = [];
const getSnapshot = () => (hydrated ? state : EMPTY);
const getServerSnapshot = () => EMPTY;

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useCartCount() {
  const items = useCart();
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function useCartSubtotal() {
  const items = useCart();
  return items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
}

export const cart = {
  add(item: Omit<CartItem, "quantity">, quantity = 1) {
    hydrate();
    const existing = state.find((i) => i.productId === item.productId);
    const max = Math.max(item.stock, 0);
    if (existing) {
      const next = Math.min(existing.quantity + quantity, max || 99);
      state = state.map((i) => (i.productId === item.productId ? { ...i, quantity: next, stock: item.stock } : i));
    } else {
      state = [...state, { ...item, quantity: Math.min(quantity, max || 99) }];
    }
    persist();
    notify();
  },
  setQuantity(productId: string, quantity: number) {
    hydrate();
    if (quantity <= 0) {
      state = state.filter((i) => i.productId !== productId);
    } else {
      state = state.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(quantity, i.stock || 99) }
          : i,
      );
    }
    persist();
    notify();
  },
  remove(productId: string) {
    hydrate();
    state = state.filter((i) => i.productId !== productId);
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

export const SHIPPING_FEE_CENTS = 0; // Free delivery
