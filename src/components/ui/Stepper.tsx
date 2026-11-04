import { Icon } from "@/src/components/icons";
import { cn } from "@/src/utils/cn";

export function Stepper({
  steps,
  currentIndex,
  onStepClick,
  maxReachedIndex,
}: {
  steps: readonly { key: string; label: string }[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
  maxReachedIndex: number;
}) {
  return (
    <div className="flex items-center overflow-x-auto scrollbar-thin pb-1">
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        const reachable = i <= maxReachedIndex;
        return (
          <div key={step.key} className="flex items-center">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onStepClick?.(i)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-2 text-[12.5px] font-semibold transition whitespace-nowrap",
                isActive && "bg-forest-800 text-white shadow-soft",
                !isActive && isDone && "text-forest-700 hover:bg-forest-50 cursor-pointer",
                !isActive && !isDone && reachable && "text-sand-500 hover:bg-sand-100 cursor-pointer",
                !isActive && !isDone && !reachable && "text-sand-300 cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                  isActive && "bg-banana-500 text-forest-900",
                  !isActive && isDone && "bg-forest-100 text-forest-700",
                  !isActive && !isDone && "bg-sand-100 text-sand-500"
                )}
              >
                {isDone ? <Icon.Check className="h-3 w-3" /> : i + 1}
              </span>
              {step.label}
            </button>
            {i < steps.length - 1 && (
              <span className="mx-0.5 h-px w-4 shrink-0 bg-sand-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}
