import type { Metadata } from "next";
import { VolunteersAdminDashboard } from "@/components/volunteers/VolunteersAdminDashboard";

export const metadata: Metadata = {
  title: "Volunteer Admin",
  robots: { index: false, follow: false },
};

export default function VolunteersAdminPage() {
  return (
    <div className="min-h-screen bg-ink px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <VolunteersAdminDashboard />
      </div>
    </div>
  );
}
