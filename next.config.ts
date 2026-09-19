import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // External/exFAT volumes break the image optimizer (AppleDouble garbage).
    // Serve public assets as-is so logos and hero art render correctly.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
