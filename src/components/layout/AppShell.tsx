"use client";

import { Suspense, useState } from "react";
import { Sidebar } from "@/src/components/layout/Sidebar";
import { Topbar } from "@/src/components/layout/Topbar";
import { SidebarSkeleton } from "@/src/components/layout/SidebarSkeleton";
import { TopbarSkeleton } from "@/src/components/layout/TopbarSkeleton";

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
        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
