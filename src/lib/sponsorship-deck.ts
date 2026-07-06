import {
  sponsorMainPackages,
  sponsorSignaturePackages,
  sponsorSupporterPackages,
  sponsorTitlePackage,
  type SponsorPackage,
} from "@/lib/site";

export type SponsorshipDeckSlide =
  | {
      kind: "cover";
      id: string;
      title: string;
      subtitle: string;
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
  return [
    {
      kind: "cover",
      id: "cover",
      title: "Torch of Excellence",
      subtitle: "Southeast Texas Visionary Awards 2026 sponsorship packages",
    },
    {
      kind: "section",
      id: "section-title",
      title: "Presenting Partner",
      subtitle: "Title Sponsor — maximum visibility across SETVA 2026",
    },
    ...packageSlides([sponsorTitlePackage]),
    {
      kind: "section",
      id: "section-main",
      title: "Main Sponsorship Packages",
      subtitle: "Flagship brand visibility across SETVA 2026",
    },
    ...packageSlides(sponsorMainPackages),
    {
      kind: "section",
      id: "section-signature",
      title: "Signature Opportunities",
      subtitle: "Exclusive placements from red carpet to live stream",
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
      subtitle: "Reserve your package, start checkout online, or email our team to confirm your tier.",
    },
  ];
}

export { formatPackagePrice };
