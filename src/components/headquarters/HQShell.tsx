"use client";

import { useState } from "react";
import type { ActivityItem } from "@/lib/headquarters/types";
import type { HQUser } from "@/lib/headquarters/auth";
import { HQSidebar } from "@/components/headquarters/HQSidebar";
import { HQHeader } from "@/components/headquarters/HQHeader";
import { HQActivityRail } from "@/components/headquarters/HQActivity";

export function HQShell({
  children,
  title,
  showActivityRail = false,
  user,
  activityItems = [],
}: {
  children: React.ReactNode;
  title?: string;
  showActivityRail?: boolean;
  user?: HQUser | null;
  activityItems?: ActivityItem[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-ink text-cream">
      <HQSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <HQHeader onMenuOpen={() => setSidebarOpen(true)} title={title} user={user} />
        <div className="flex flex-1">
          <main className="min-w-0 flex-1 overflow-x-hidden p-4 lg:p-6">{children}</main>
          {showActivityRail ? <HQActivityRail items={activityItems} /> : null}
        </div>
      </div>
    </div>
  );
}
