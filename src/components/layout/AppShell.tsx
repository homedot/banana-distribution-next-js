"use client";

import { Suspense, useState } from "react";
import { Sidebar } from "@/src/components/layout/Sidebar";
import { Topbar } from "@/src/components/layout/Topbar";
import { SidebarSkeleton } from "@/src/components/layout/SidebarSkeleton";
import { TopbarSkeleton } from "@/src/components/layout/TopbarSkeleton";
import { useAppData } from "@/src/store/data-context";

function DataStatusBar() {
  const { loading, error, refresh } = useAppData();

  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 bg-red-50 px-5 py-2 text-[12.5px] font-medium text-red-700 lg:px-8">
        <span>Couldn&apos;t load data from the server: {error}</span>
        <button
          type="button"
          onClick={refresh}
          className="shrink-0 rounded-lg border border-red-200 px-2.5 py-1 font-semibold hover:bg-red-100 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-sand-100 px-5 py-1.5 text-[12px] font-medium text-sand-500 lg:px-8">
        Syncing data…
      </div>
    );
  }

  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-sand-50">
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      </Suspense>
      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <Suspense fallback={<TopbarSkeleton />}>
          <Topbar onMenu={() => setMobileOpen(true)} />
        </Suspense>
        <DataStatusBar />
        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
