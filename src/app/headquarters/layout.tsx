import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Headquarters",
  robots: { index: false, follow: false },
};

export default function HeadquartersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
