import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const px = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-label={`Rated ${value} out of 5`}>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              px,
              i < Math.round(value)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted-foreground/30",
            )}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        {value.toFixed(1)}
        {typeof count === "number" && ` (${count})`}
      </span>
    </div>
  );
}
