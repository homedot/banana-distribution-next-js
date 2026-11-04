import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-sand-300 bg-sand-50/60 px-6 py-14 text-center">
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-banana-600 shadow-soft">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-bold text-sand-800">{title}</p>
        {description && (
          <p className="max-w-sm text-[13px] text-sand-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
