import { timingSafeEqual } from "crypto";

export function hqAdminSignupPassword(): string {
  return process.env.HEADQUARTERS_ADMIN_SIGNUP_PASSWORD?.trim() || "Visionary2526";
}

export function verifyHQAdminSignupPassword(input: string): boolean {
  const expected = hqAdminSignupPassword();
  const inputBuf = Buffer.from(input);
  const expectedBuf = Buffer.from(expected);
  if (inputBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(inputBuf, expectedBuf);
}
