import { PUBLIC_ERROR_MESSAGE } from "@/lib/errors/constants";

export { PUBLIC_ERROR_MESSAGE };

/** Use for any failed API call or unexpected client-side failure shown to users. */
export function publicErrorMessage(): string {
  return PUBLIC_ERROR_MESSAGE;
}
