import { Icon } from "@/src/components/icons";

/** Static placeholder rendered while the real, URL-aware Topbar streams in. */
export function TopbarSkeleton() {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-sand-200/80 bg-sand-50/85 px-5 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sand-200 bg-white text-sand-600 lg:hidden">
          <Icon.Menu className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-[18px] font-extrabold leading-tight text-sand-900">
            St. Mary&apos;s
          </h1>
          <p className="text-[12.5px] text-sand-500">Banana Sale</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="hidden h-10 w-[168px] rounded-xl bg-banana-500/60 sm:block" />
        <div className="flex h-11 items-center gap-2 rounded-xl border-2 border-red-200 bg-white px-3.5 text-[14px] font-bold text-red-700">
          <Icon.LogOut className="h-5 w-5" />
          Logout
        </div>
      </div>
    </header>
  );
}
