"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, NAV_ICONS } from "@/src/components/icons";
import { NAV_ITEMS } from "@/src/utils/constants";
import { cn } from "@/src/utils/cn";
import {
  LogoutButton,
  useCurrentUserEmail,
  useCurrentUserRole,
} from "@/src/components/layout/AccountControls";
import { BrandMark } from "@/src/components/brand/BrandLogo";

function SidebarAccount({ onCloseMobile }: { onCloseMobile: () => void }) {
  const email = useCurrentUserEmail();
  return (
    <div className="m-4 space-y-3 rounded-2xl bg-forest-800/70 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-banana-500 text-[15px] font-extrabold uppercase text-forest-900">
          {email ? email[0] : <Icon.Users className="h-5 w-5" />}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-[11.5px] font-semibold text-forest-300">Signed in as</p>
          <p className="truncate text-[13.5px] font-bold text-white" title={email ?? undefined}>
            {email ?? "…"}
          </p>
        </div>
      </div>
      <LogoutButton variant="sidebar" onBeforeOpen={onCloseMobile} />
    </div>
  );
}

const iconMap = NAV_ICONS;

export function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const role = useCurrentUserRole();
  // Admin-only links (Dashboard) stay hidden until the role is known, so an
  // accountant never sees them flash in.
  const navItems = NAV_ITEMS.filter(
    (item) => !("adminOnly" in item && item.adminOnly) || role === "admin",
  );

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
          "fixed inset-y-0 left-0 z-50 flex w-[272px] shrink-0 -translate-x-full flex-col bg-forest-900 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileOpen && "translate-x-0",
        )}
      >
        <div className="flex h-[72px] items-center gap-2.5 px-6">
          <BrandMark size={44} />
          <div className="leading-tight">
            <p className="font-brand text-[17px] font-black text-white">
              St. Mary&apos;s
            </p>
            <p className="text-[11px] font-medium text-forest-300">
              Banana Sale
            </p>
          </div>
        </div>

        <nav className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto px-4 scrollbar-thin">
          <p className="px-2.5 pb-2 pt-3 text-[11px] font-bold uppercase tracking-wider text-forest-400">
            Operations
          </p>
          {navItems.map((item) => {
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
                    : "text-forest-100/80 hover:bg-forest-800 hover:text-white",
                )}
              >
                <ItemIcon
                  className={cn(
                    "h-[18px] w-[18px]",
                    active
                      ? "text-forest-900"
                      : "text-forest-300 group-hover:text-banana-300",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <SidebarAccount onCloseMobile={onCloseMobile} />
      </aside>
    </>
  );
}
