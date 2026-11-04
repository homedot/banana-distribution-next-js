"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/src/components/icons";
import { NAV_ITEMS } from "@/src/utils/constants";
import { cn } from "@/src/utils/cn";

const iconMap: Record<string, (p: { className?: string }) => React.ReactElement> = {
  grid: Icon.Grid,
  truck: Icon.Truck,
  package: Icon.Package,
  store: Icon.Store,
  chart: Icon.Chart,
};

export function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close menu"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-sand-900/40 lg:hidden"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[272px] shrink-0 -translate-x-full flex-col bg-forest-900 transition-transform duration-200 lg:static lg:translate-x-0",
          mobileOpen && "translate-x-0"
        )}
      >
        <div className="flex h-[72px] items-center gap-2.5 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-banana-500 text-forest-900 shadow-soft">
            <Icon.Banana className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-[14px] font-extrabold text-white">St. Mary&apos;s</p>
            <p className="text-[11px] font-medium text-forest-300">Banana Distribution</p>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-4">
          <p className="px-2.5 pb-2 pt-3 text-[11px] font-bold uppercase tracking-wider text-forest-400">
            Operations
          </p>
          {NAV_ITEMS.map((item) => {
            const ItemIcon = iconMap[item.icon];
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors",
                  active
                    ? "bg-banana-500 text-forest-900 shadow-soft"
                    : "text-forest-100/80 hover:bg-forest-800 hover:text-white"
                )}
              >
                <ItemIcon
                  className={cn(
                    "h-[18px] w-[18px]",
                    active ? "text-forest-900" : "text-forest-300 group-hover:text-banana-300"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="m-4 rounded-2xl bg-forest-800/70 p-4">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-banana-300">
            <Icon.Sparkle className="h-3.5 w-3.5" /> Daily tip
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-forest-200">
            Close a broker batch as soon as remaining stock hits zero to keep
            the overview accurate.
          </p>
        </div>
      </aside>
    </>
  );
}
