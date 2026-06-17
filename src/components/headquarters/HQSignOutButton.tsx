"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HQButton } from "@/components/headquarters/ui";

export function HQSignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await fetch("/api/headquarters/session", { method: "DELETE" });
      router.push("/headquarters/login");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <HQButton variant="outline" onClick={() => void handleSignOut()} disabled={loading}>
      {loading ? "Signing out…" : "Sign out"}
    </HQButton>
  );
}
