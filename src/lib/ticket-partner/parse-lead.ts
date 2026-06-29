const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type TicketPartnerLeadInput = {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
};

export function parseTicketPartnerLeadInput(
  body: Record<string, unknown>,
): { data: TicketPartnerLeadInput } | { error: string } {
  const buyerName = String(body.buyerName ?? "").trim().slice(0, 120);
  const buyerEmail = String(body.buyerEmail ?? body.email ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
  const buyerPhone = String(body.buyerPhone ?? body.phone ?? "").trim().slice(0, 40);

  if (!buyerName) return { error: "Please enter your name." };
  if (!buyerPhone) return { error: "Phone number is required." };
  if (!buyerEmail || !EMAIL_PATTERN.test(buyerEmail)) {
    return { error: "A valid email address is required." };
  }

  return { data: { buyerName, buyerEmail, buyerPhone } };
}
