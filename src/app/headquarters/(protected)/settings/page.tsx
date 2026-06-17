import { redirect } from "next/navigation";
import { HQShell } from "@/components/headquarters/HQShell";
import { HQSignOutButton } from "@/components/headquarters/HQSignOutButton";
import { HQCard, HQCardHeader } from "@/components/headquarters/ui";
import { formatHQPhone } from "@/lib/headquarters/auth";
import { getHQSessionUser } from "@/lib/headquarters/auth-server";

export default async function SettingsPage() {
  const user = await getHQSessionUser();
  if (!user) redirect("/headquarters/login");

  return (
    <HQShell title="Settings" user={user}>
      <p className="mb-6 text-sm text-cream/50">Your account and sign-in details.</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <HQCard className="overflow-hidden">
          <HQCardHeader title="Account" subtitle="Your SETVA Headquarters profile" />
          <dl className="space-y-4 px-5 py-5 text-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-cream/35">Name</dt>
              <dd className="mt-1 font-medium text-cream">{user.name}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-cream/35">Email</dt>
              <dd className="mt-1 text-cream/80">{user.email}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-cream/35">Phone</dt>
              <dd className="mt-1 text-cream/80">
                <a href={`tel:+1${user.phone.replace(/\D/g, "")}`} className="hover:text-gold">
                  {formatHQPhone(user.phone)}
                </a>
              </dd>
            </div>
          </dl>
        </HQCard>

        <HQCard className="overflow-hidden">
          <HQCardHeader title="Sign in" subtitle="How you access Headquarters" />
          <dl className="space-y-4 px-5 py-5 text-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-cream/35">Sign-in email</dt>
              <dd className="mt-1 text-cream/80">{user.email}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-cream/35">Password</dt>
              <dd className="mt-1 text-cream/50">••••••••</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-cream/35">Access</dt>
              <dd className="mt-1 text-cream/80">SETVA Headquarters</dd>
            </div>
          </dl>
          <div className="border-t border-gold/10 px-5 py-4">
            <HQSignOutButton />
          </div>
        </HQCard>
      </div>
    </HQShell>
  );
}
