import type { Metadata } from "next";
import { MediaCredentialsAdminDashboard } from "@/components/media-credentials/MediaCredentialsAdminDashboard";

export const metadata: Metadata = {
  title: "Media Credentials Admin",
  robots: { index: false, follow: false },
};

export default function MediaCredentialsAdminPage() {
  return (
    <div className="min-h-screen bg-ink px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <MediaCredentialsAdminDashboard />
      </div>
    </div>
  );
}
