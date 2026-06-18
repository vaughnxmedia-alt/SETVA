import type { ReactNode } from "react";
import { SetvaGradientPageShell } from "@/components/SetvaGradientPageShell";

export function NominationsPageShell({ children }: { children: ReactNode }) {
  return <SetvaGradientPageShell>{children}</SetvaGradientPageShell>;
}
