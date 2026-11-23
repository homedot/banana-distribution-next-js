"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/Button";
import { LogoutButton, SignedInChip } from "@/src/components/layout/AccountControls";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Today's Sale snapshot" },
  "/distributions": { title: "Sales", subtitle: "Every dispatch, tracked end to end" },
  "/brokers": { title: "Brokers", subtitle: "Inward stock & procurement" },
  "/vendors": { title: "Customers", subtitle: "Shopkeeper ledgers & balances" },
  "/payments": { title: "Payments", subtitle: "Record customer payments against pending balances" },
  "/kola-categories": { title: "Kola Categories", subtitle: "Kaya types offered on New Sale" },
  "/activity": { title: "Activity Log", subtitle: "Who created, edited or deleted what" },
  "/reports": { title: "Reports", subtitle: "Performance across the business" },
};

function resolveTitle(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  const base = "/" + (pathname.split("/")[1] ?? "");
  if (TITLES[base]) {
    if (pathname.endsWith("/new")) {
      return { title: "New Sale", subtitle: "Step-by-step dispatch entry" };
    }
    return { title: "Details", subtitle: TITLES[base].title };
  }
  return { title: "St. Mary's", subtitle: "Banana Sale" };
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const { title, subtitle } = resolveTitle(pathname);


  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-sand-200/80 bg-sand-50/85 px-5 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-sand-200 bg-white text-sand-600 lg:hidden cursor-pointer"
        >
          <Icon.Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[18px] font-extrabold leading-tight text-sand-900">
            {title}
          </h1>
          <p className="text-[12.5px] text-sand-500">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Link href="/distributions/new" className="hidden sm:block">
          <Button size="md">
            <Icon.Plus className="h-4 w-4" />
            New Sale
          </Button>
        </Link>
        <SignedInChip />
        <LogoutButton variant="topbar" />
      </div>
    </header>
  );
}
