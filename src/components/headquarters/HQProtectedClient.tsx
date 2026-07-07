"use client";

import { HQSessionGuard } from "@/components/headquarters/HQSessionGuard";

export function HQProtectedClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HQSessionGuard />
      {children}
    </>
  );
}
