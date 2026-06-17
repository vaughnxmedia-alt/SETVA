const SENSITIVE_KEY = /password|token|secret|api[_-]?key|authorization|card|cvv|pan/i;

export function sanitizeMetadata(
  input: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!input) return undefined;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = sanitizeMetadata(value as Record<string, unknown>);
      continue;
    }
    out[key] = value;
  }
  return out;
}
