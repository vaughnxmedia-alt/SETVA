import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PlaceholderBanner } from "@/components/PlaceholderBanner";
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
  title: {
    default: `${site.fullName} | ${site.name} 2026`,
    template: `%s | ${site.name}`,
  },
  description: site.tagline,
  openGraph: {
    title: site.fullName,
    description: site.motto,
    url: "https://setvawards.com",
    siteName: site.name,
    locale: "en_US",
    type: "website",
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
      <body className="min-h-full flex flex-col antialiased">
        <PlaceholderBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
