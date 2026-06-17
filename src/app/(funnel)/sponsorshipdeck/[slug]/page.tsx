import type { Metadata } from "next";
import {
  SponsorshipDeckAccessView,
  sponsorshipDeckAccessMetadata,
} from "@/components/sponsorship-deck/SponsorshipDeckAccessView";

export const metadata: Metadata = sponsorshipDeckAccessMetadata;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ access?: string }>;
};

export default async function SponsorshipDeckRecipientPage({
  searchParams,
}: PageProps) {
  const { access } = await searchParams;
  return <SponsorshipDeckAccessView access={access?.trim() ?? ""} />;
}
