import { cn } from "@/src/utils/cn";

export function ProgressBar({
  value,
  className,
  tone = "banana",
}: {
  value: number;
  className?: string;
  tone?: "banana" | "forest";
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-sand-100", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          tone === "banana" ? "bg-banana-500" : "bg-forest-500"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
