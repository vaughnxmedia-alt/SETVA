"use client";

import { useMemo, useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import { SponsorsSubnav } from "@/components/headquarters/SponsorsSubnav";
import {
  HQBadge,
  HQButton,
  HQCard,
  HQCardHeader,
  HQEmptyState,
  HQSearchInput,
  HQStatCard,
  hqPanelClass,
  hqTableWrapClass,
} from "@/components/headquarters/ui";
import { buildSponsorFulfillmentEmail } from "@/lib/sponsor-fulfillment";
import type { SponsorPackageInventoryRow } from "@/lib/headquarters/types";

function availabilityTone(row: SponsorPackageInventoryRow): "green" | "amber" | "red" | "default" {
  if (row.remaining === 0) return "red";
  if (row.remaining === 1) return "amber";
  if (row.soldCount > 0) return "green";
  return "default";
}

function paymentTone(status: string): "green" | "amber" | "red" | "default" {
  if (status === "Paid in full") return "green";
  if (status.includes("Check pending")) return "amber";
  if (status === "Payment outstanding") return "red";
  return "default";
}

export function SponsorPackagesView({
  packages,
}: {
  packages: SponsorPackageInventoryRow[];
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [buyerContactName, setBuyerContactName] = useState("");
  const [buyerCompanyName, setBuyerCompanyName] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return packages;
    return packages.filter(
      (pkg) =>
        pkg.packageName.toLowerCase().includes(q) ||
        pkg.group.toLowerCase().includes(q) ||
        pkg.buyers.some(
          (buyer) =>
            buyer.companyName.toLowerCase().includes(q) ||
            buyer.contactName.toLowerCase().includes(q) ||
            buyer.email.toLowerCase().includes(q),
        ),
    );
  }, [packages, search]);

  const selected =
    filtered.find((pkg) => pkg.packageId === selectedId) ??
    packages.find((pkg) => pkg.packageId === selectedId) ??
    null;

  const totals = useMemo(() => {
    const soldOut = packages.filter((pkg) => pkg.remaining === 0).length;
    const paidBuyers = packages.reduce(
      (sum, pkg) => sum + pkg.buyers.filter((b) => b.paymentStatus === "Paid in full").length,
      0,
    );
    const pending = packages.reduce((sum, pkg) => sum + pkg.pendingCount, 0);
    return { soldOut, paidBuyers, pending };
  }, [packages]);

  function openPackage(pkg: SponsorPackageInventoryRow) {
    setSelectedId(pkg.packageId);
    setCopyMessage(null);
    const firstBuyer = pkg.buyers[0];
    setBuyerContactName(firstBuyer?.contactName ?? "");
    setBuyerCompanyName(firstBuyer?.companyName ?? "");
  }

  async function copyFulfillmentEmail() {
    if (!selected) return;
    const { subject, body } = buildSponsorFulfillmentEmail(
      {
        id: selected.packageId,
        name: selected.packageName,
        price: selected.price,
        description: "",
        benefits: [],
        group: selected.group as "main" | "signature" | "supporter",
      },
      buyerContactName.trim() || "[Contact Name]",
      buyerCompanyName.trim() || "[Company Name]",
    );
    const text = `Subject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Fulfillment email copied to clipboard.");
    } catch {
      setCopyMessage("Could not copy — select and copy manually.");
    }
  }

  return (
    <HQShell title="Sponsors">
      <SponsorsSubnav />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl text-cream">Package management</h1>
          <p className="mt-2 max-w-3xl text-sm text-cream/60">
            Track slot availability, confirmed buyers, and pending checkouts. Copy
            fulfillment requirements to send after purchase.
          </p>
        </div>
        <div className="w-full lg:w-72">
          <HQSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search packages or buyers…"
          />
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <HQStatCard label="Paid sponsors" value={totals.paidBuyers} />
        <HQStatCard label="Pending payments" value={totals.pending} hint="Checkout or check in progress" />
        <HQStatCard label="Sold-out packages" value={totals.soldOut} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className={hqTableWrapClass}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
              <tr>
                <th className="px-4 py-3 font-semibold">Package</th>
                <th className="px-4 py-3 font-semibold">Investment</th>
                <th className="px-4 py-3 font-semibold">Slots</th>
                <th className="px-4 py-3 font-semibold">Paid</th>
                <th className="px-4 py-3 font-semibold">Pending</th>
                <th className="px-4 py-3 font-semibold">Availability</th>
              </tr>
            </thead>
            <tbody className="text-cream/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8">
                    <HQEmptyState
                      title="No packages match"
                      description="Try a different search term."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((pkg) => (
                  <tr
                    key={pkg.packageId}
                    onClick={() => openPackage(pkg)}
                    className={`cursor-pointer border-b border-gold/10 transition hover:bg-gold/5 ${
                      selectedId === pkg.packageId ? "bg-gold/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-cream">{pkg.packageName}</p>
                      <p className="text-xs capitalize text-cream/45">{pkg.group}</p>
                    </td>
                    <td className="px-4 py-3 text-gold">
                      ${pkg.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {pkg.maxAvailable ?? "∞"}
                    </td>
                    <td className="px-4 py-3">{pkg.soldCount}</td>
                    <td className="px-4 py-3">{pkg.pendingCount}</td>
                    <td className="px-4 py-3">
                      <HQBadge tone={availabilityTone(pkg)}>{pkg.availabilityLabel}</HQBadge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          {!selected ? (
            <HQCard>
              <HQCardHeader
                title="Package details"
                subtitle="Select a package to view buyers and fulfillment requirements."
              />
              <div className="px-5 py-8">
                <HQEmptyState
                  title="No package selected"
                  description="Click a row to see buyers, slot usage, and the email to request company assets."
                />
              </div>
            </HQCard>
          ) : (
            <>
              <HQCard>
                <HQCardHeader
                  title={selected.packageName}
                  subtitle={`$${selected.price.toLocaleString()} · ${selected.availabilityLabel}`}
                />
                <div className="space-y-4 px-5 py-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg border border-gold/10 bg-black/20 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-cream/40">Paid</p>
                      <p className="mt-1 text-xl font-semibold text-cream">{selected.soldCount}</p>
                    </div>
                    <div className="rounded-lg border border-gold/10 bg-black/20 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-cream/40">Pending</p>
                      <p className="mt-1 text-xl font-semibold text-cream">{selected.pendingCount}</p>
                    </div>
                    <div className="rounded-lg border border-gold/10 bg-black/20 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-cream/40">Left</p>
                      <p className="mt-1 text-xl font-semibold text-cream">
                        {selected.remaining ?? "∞"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-cream">Buyers</h3>
                    {selected.buyers.length === 0 ? (
                      <p className="mt-2 text-sm text-cream/50">No buyers yet for this package.</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {selected.buyers.map((buyer) => (
                          <li
                            key={buyer.id}
                            className="rounded-lg border border-gold/10 bg-black/20 px-3 py-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-cream">{buyer.companyName}</p>
                                <p className="text-xs text-cream/55">
                                  {buyer.contactName}
                                  {buyer.jobTitle ? ` · ${buyer.jobTitle}` : ""}
                                </p>
                                <p className="text-xs text-cream/45">{buyer.email}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <HQBadge tone={paymentTone(buyer.paymentStatus)}>
                                  {buyer.paymentStatus}
                                </HQBadge>
                                <HQBadge tone="default">{buyer.fulfillmentStatus}</HQBadge>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </HQCard>

              <HQCard>
                <HQCardHeader
                  title="Company requirements"
                  subtitle="Send this after purchase to collect assets and activation details."
                  action={
                    <HQButton type="button" onClick={() => void copyFulfillmentEmail()}>
                      Copy email
                    </HQButton>
                  }
                />
                <div className="space-y-4 px-5 py-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="text-cream/70">Contact name</span>
                      <input
                        value={buyerContactName}
                        onChange={(e) => setBuyerContactName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gold/20 bg-black/40 px-3 py-2 text-sm text-cream outline-none focus:border-gold/50"
                        placeholder="Contact name"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-cream/70">Company name</span>
                      <input
                        value={buyerCompanyName}
                        onChange={(e) => setBuyerCompanyName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gold/20 bg-black/40 px-3 py-2 text-sm text-cream outline-none focus:border-gold/50"
                        placeholder="Company name"
                      />
                    </label>
                  </div>

                  {copyMessage ? (
                    <p className="text-sm text-gold">{copyMessage}</p>
                  ) : null}

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-cream/40">
                      Assets & info needed
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-cream/75">
                      {selected.assetsNeeded.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className={`${hqPanelClass} p-4`}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold/80">
                      Email preview
                    </p>
                    <p className="mt-2 text-sm font-medium text-cream">
                      {selected.fulfillmentEmailSubject}
                    </p>
                    <pre className="mt-3 whitespace-pre-wrap font-sans text-xs leading-relaxed text-cream/70">
                      {buildSponsorFulfillmentEmail(
                        {
                          id: selected.packageId,
                          name: selected.packageName,
                          price: selected.price,
                          description: "",
                          benefits: [],
                          group: selected.group as "main" | "signature" | "supporter",
                        },
                        buyerContactName.trim() || "[Contact Name]",
                        buyerCompanyName.trim() || "[Company Name]",
                      ).body}
                    </pre>
                  </div>
                </div>
              </HQCard>
            </>
          )}
        </div>
      </div>
    </HQShell>
  );
}
