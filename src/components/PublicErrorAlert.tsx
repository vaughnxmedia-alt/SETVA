import { PUBLIC_ERROR_MESSAGE } from "@/lib/errors/client";

type PublicErrorAlertProps = {
  className?: string;
};

export function PublicErrorAlert({
  className = "",
}: PublicErrorAlertProps) {
  return (
    <p
      role="alert"
      className={`rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200 ${className}`}
    >
      {PUBLIC_ERROR_MESSAGE}
    </p>
  );
}
