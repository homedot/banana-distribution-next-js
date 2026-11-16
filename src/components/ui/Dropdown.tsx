"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/src/utils/cn";
import { Icon } from "@/src/components/icons";

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  /** Optional smaller second line, e.g. an English name under a Malayalam one. */
  hint?: string;
}

/**
 * Large, high-contrast dropdown built for readability (older staff, bright
 * shop light, touch screens): 56px rows, 18px text, a clear check mark on the
 * selected option, and full keyboard support (↑ ↓ Home End Enter Space Esc,
 * and typing a letter to jump).
 */
export function Dropdown<T extends string>({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = "Select…",
  error,
  hint,
}: {
  label: string;
  required?: boolean;
  value: T | "";
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [openUp, setOpenUp] = useState(false);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  function openList() {
    // Open upwards when there isn't room below (e.g. near the bottom save bar).
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const listHeight = Math.min(options.length * 60 + 16, 360);
      setOpenUp(window.innerHeight - rect.bottom < listHeight + 96 && rect.top > listHeight);
    }
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  // Close on outside click / tap.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the keyboard-highlighted option visible.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        // Type-to-jump: first option whose label or hint starts with the key.
        if (e.key.length === 1) {
          const k = e.key.toLowerCase();
          const i = options.findIndex(
            (o) => o.label.toLowerCase().startsWith(k) || o.hint?.toLowerCase().startsWith(k)
          );
          if (i >= 0) setActive(i);
        }
    }
  }

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-2">
      <span id={`${id}-label`} className="text-[15px] font-bold text-sand-800">
        {label}
        {required && <span className="ml-0.5 text-banana-600">*</span>}
      </span>

      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={`${id}-label ${id}-value`}
          aria-invalid={Boolean(error) || undefined}
          aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
          className={cn(
            "flex h-14 w-full items-center justify-between gap-3 rounded-2xl border-2 bg-white px-4 text-left transition cursor-pointer",
            "outline-none focus-visible:ring-4 focus-visible:ring-forest-200",
            open
              ? "border-forest-600 ring-4 ring-forest-100"
              : error
                ? "border-red-400"
                : "border-sand-300 hover:border-forest-400"
          )}
        >
          <span id={`${id}-value`} className="min-w-0 flex-1 truncate">
            {selected ? (
              <span className="text-[18px] font-semibold leading-tight text-sand-900">
                {selected.label}
                {selected.hint && (
                  <span className="ml-2 text-[14px] font-medium text-sand-500">
                    {selected.hint}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-[17px] font-medium text-sand-500">{placeholder}</span>
            )}
          </span>
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition",
              open ? "rotate-180 bg-forest-700 text-white" : "bg-sand-100 text-sand-700"
            )}
          >
            <Icon.ChevronDown className="h-5 w-5" />
          </span>
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className={cn(
              "absolute left-0 right-0 z-40 max-h-[360px] overflow-y-auto rounded-2xl border-2 border-sand-200 bg-white p-2 shadow-lift scrollbar-thin",
              openUp ? "bottom-full mb-2" : "top-full mt-2"
            )}
          >
            {options.map((o, i) => {
              const isSelected = o.value === value;
              const isActive = i === active;
              return (
                <li
                  key={o.value}
                  id={`${id}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-2.5 transition-colors",
                    isSelected
                      ? "bg-forest-700 text-white"
                      : isActive
                        ? "bg-banana-100 text-sand-900"
                        : "text-sand-900"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-[18px] font-semibold leading-snug">{o.label}</span>
                    {o.hint && (
                      <span
                        className={cn(
                          "block text-[13.5px] font-medium",
                          isSelected ? "text-forest-100" : "text-sand-500"
                        )}
                      >
                        {o.hint}
                      </span>
                    )}
                  </span>
                  {isSelected && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-forest-700">
                      <Icon.Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {hint && !error && <span className="text-[13px] text-sand-600">{hint}</span>}
      {error && (
        <span className="flex items-center gap-1.5 text-[14px] font-semibold text-red-600">
          <Icon.AlertCircle className="h-4 w-4" /> {error}
        </span>
      )}
    </div>
  );
}
