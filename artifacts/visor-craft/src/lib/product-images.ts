import visorBlue from "@/assets/visor-blue.jpg";
import visorSmoke from "@/assets/visor-smoke.jpg";
import visorClear from "@/assets/visor-clear.jpg";
import visorGold from "@/assets/visor-gold.jpg";

const map: Record<string, string> = {
  blue: visorBlue,
  smoke: visorSmoke,
  clear: visorClear,
  gold: visorGold,
};

export function resolveProductImage(key: string | null | undefined): string {
  if (!key) return visorBlue;
  if (key.startsWith("http") || key.startsWith("/")) return key;
  return map[key] ?? visorBlue;
}
