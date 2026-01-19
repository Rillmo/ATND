import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import OrgActions from "@/components/OrgActions";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookie } from "@/lib/i18n-server";

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const locale = await getLocaleFromCookie();
  const dictionary = getDictionary(locale);

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("organization_members")
    .select(
      "role, organizations ( id, name, description, image_url, invite_code, manager_user_id )"
    )
    .eq("user_id", session.user.id)
    .order("joined_at", { ascending: false });

  const orgs = (
    (data as unknown as Array<{
      role: "MANAGER" | "MEMBER";
      organizations: {
        id: string;
        name: string;
        description: string | null;
        image_url: string | null;
        invite_code: string;
        manager_user_id: string;
      } | null;
    }>) ?? []
  ).map((row) => ({
    role: row.role,
    organization: row.organizations,
  }));

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          {dictionary.dashboard.greeting},{" "}
          {session.user.name ?? dictionary.dashboard.roleMember}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {dictionary.dashboard.subtext}
        </p>
      </section>

      <OrgActions />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">
          {dictionary.dashboard.myOrgs}
        </h2>
        {orgs.length === 0 ? (
          <p className="text-sm text-slate-500">
            {dictionary.dashboard.noOrgs}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orgs.map((entry) => (
              <Link
                key={entry.organization?.id}
                href={`/orgs/${entry.organization?.id}`}
                className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 transition hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {entry.organization?.name}
                  </h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {entry.role === "MANAGER"
                      ? dictionary.dashboard.roleManager
                      : dictionary.dashboard.roleMember}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {entry.organization?.description ??
                    dictionary.org.noDescription}
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  {dictionary.dashboard.inviteCode}:{" "}
                  {entry.organization?.invite_code}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
