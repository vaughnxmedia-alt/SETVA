import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { createPageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  ...createPageMetadata({
    title: `${site.fullName} | ${site.name} 2026`,
    description: site.tagline,
  }),
  title: {
    default: `${site.fullName} | ${site.name} 2026`,
    template: `%s | ${site.name}`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
