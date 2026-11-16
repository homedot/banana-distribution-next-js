import { Icon, NAV_ICONS } from "@/src/components/icons";
import { NAV_ITEMS } from "@/src/utils/constants";
import { BrandMark } from "@/src/components/brand/BrandLogo";

const iconMap = NAV_ICONS;

/** Static placeholder rendered while the real, URL-aware Sidebar streams in. */
export function SidebarSkeleton() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[272px] shrink-0 flex-col bg-forest-900 lg:sticky lg:top-0 lg:flex lg:h-screen">
      <div className="flex h-[72px] items-center gap-2.5 px-6">
        <BrandMark size={44} />
        <div className="leading-tight">
          <p className="font-brand text-[17px] font-black text-white">
            St. Mary&apos;s
          </p>
          <p className="text-[11px] font-medium text-forest-300">Banana Sale</p>
        </div>
      </div>

      <nav className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto px-4 scrollbar-thin">
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

      <div className="m-4 space-y-3 rounded-2xl bg-forest-800/70 p-4">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 shrink-0 rounded-full bg-banana-500/60" />
          <div className="space-y-1.5">
            <span className="block h-2.5 w-16 rounded bg-forest-700" />
            <span className="block h-3 w-28 rounded bg-forest-700" />
          </div>
        </div>
        <div className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white/10 text-[14.5px] font-bold text-white ring-1 ring-white/15">
          <Icon.LogOut className="h-5 w-5" />
          Logout
        </div>
      </div>
    </aside>
  );
}
