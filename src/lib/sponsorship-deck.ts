import {
  sponsorMainPackages,
  sponsorSignaturePackages,
  sponsorSupporterPackages,
  type SponsorPackage,
} from "@/lib/site";

export const sponsorshipDeckAssets = {
  cover: "/sponsors/deck/cover.png",
  sectionBackground: "/sponsors/deck/section-bg.png",
} as const;

export type SponsorshipDeckSlide =
  | {
      kind: "cover";
      id: string;
      image: string;
      alt: string;
    }
  | {
      kind: "section";
      id: string;
      title: string;
      subtitle?: string;
    }
  | {
      kind: "package";
      id: string;
      pkg: SponsorPackage;
    }
  | {
      kind: "closing";
      id: string;
      title: string;
      subtitle: string;
    };

function formatPackagePrice(pkg: SponsorPackage): string {
  if (pkg.contactOnly || pkg.price <= 0) return "Contact for pricing";
  return `$${pkg.price.toLocaleString()}`;
}

function packageSlides(packages: SponsorPackage[]): SponsorshipDeckSlide[] {
  return packages.map((pkg) => ({
    kind: "package" as const,
    id: `package-${pkg.id}`,
    pkg,
  }));
}

export function buildSponsorshipDeckSlides(): SponsorshipDeckSlide[] {
  const slides: SponsorshipDeckSlide[] = [
    {
      kind: "cover",
      id: "cover",
      image: sponsorshipDeckAssets.cover,
      alt: "SETVA 2026 Torch of Excellence",
    },
    {
      kind: "section",
      id: "section-main",
      title: "Main Sponsorship Packages",
      subtitle: "Torch of Excellence tiers — flagship brand visibility across SETVA 2026",
    },
    ...packageSlides(sponsorMainPackages),
    {
      kind: "section",
      id: "section-signature",
      title: "Signature Opportunities",
      subtitle: "Exclusive placements from red carpet to live stream and category naming",
    },
    ...packageSlides(sponsorSignaturePackages),
    {
      kind: "section",
      id: "section-supporter",
      title: "Community Supporters",
      subtitle: "Accessible ways to stand with Southeast Texas visionaries",
    },
    ...packageSlides(sponsorSupporterPackages),
    {
      kind: "closing",
      id: "closing",
      title: "Partner with SETVA 2026",
      subtitle: "Request the deck, reserve your package, or start checkout online.",
    },
  ];

  return slides;
}

export { formatPackagePrice };
