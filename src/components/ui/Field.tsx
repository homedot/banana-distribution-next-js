"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/src/utils/cn";
import { Icon } from "@/src/components/icons";

export function FieldShell({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-[13px] font-semibold text-sand-700">
          {label}
          {required && <span className="ml-0.5 text-banana-600">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="text-xs text-sand-500">{hint}</span>}
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

const baseFieldClasses =
  "w-full rounded-xl border border-sand-200 bg-white px-3.5 text-[14px] text-sand-900 placeholder:text-sand-400 outline-none transition focus:border-forest-400 focus:ring-4 focus:ring-forest-100 disabled:bg-sand-50 disabled:text-sand-400";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, className, prefix, ...props },
  ref
) {
  const hasPrefix = Boolean(prefix);
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        {hasPrefix && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-sand-400">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            baseFieldClasses,
            "h-11",
            hasPrefix && "pl-8",
            error && "border-red-300 focus:border-red-400 focus:ring-red-100",
            className
          )}
          {...props}
        />
      </div>
    </FieldShell>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, hint, error, required, className, ...props }, ref) {
    return (
      <FieldShell label={label} hint={hint} error={error} required={required}>
        <textarea
          ref={ref}
          className={cn(baseFieldClasses, "min-h-24 py-2.5 resize-none", className)}
          {...props}
        />
      </FieldShell>
    );
  }
);

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, hint, error, required, className, children, ...props }, ref) {
    return (
      <FieldShell label={label} hint={hint} error={error} required={required}>
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              baseFieldClasses,
              "h-11 appearance-none pr-10",
              error && "border-red-300 focus:border-red-400 focus:ring-red-100",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <Icon.ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" />
        </div>
      </FieldShell>
    );
  }
);
