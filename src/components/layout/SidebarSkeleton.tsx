import { Icon } from "@/src/components/icons";
import { NAV_ITEMS } from "@/src/utils/constants";

const iconMap: Record<string, (p: { className?: string }) => React.ReactElement> = {
  grid: Icon.Grid,
  truck: Icon.Truck,
  package: Icon.Package,
  store: Icon.Store,
  chart: Icon.Chart,
};

/** Static placeholder rendered while the real, URL-aware Sidebar streams in. */
export function SidebarSkeleton() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[272px] shrink-0 flex-col bg-forest-900 lg:static lg:flex">
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
          return (
            <div
              key={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-forest-100/80"
            >
              <ItemIcon className="h-[18px] w-[18px] text-forest-300" />
              {item.label}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
