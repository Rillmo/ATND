import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import OrgActions from "@/components/OrgActions";

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("organization_members")
    .select(
      "role, organizations ( id, name, description, image_url, invite_code, manager_user_id )"
    )
    .eq("user_id", session.user.id)
    .order("joined_at", { ascending: false });

  const orgs = (data ?? []).map((row) => ({
    role: row.role,
    organization: row.organizations,
  }));

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-200/70">
        <h1 className="text-2xl font-semibold text-slate-900">
          안녕하세요, {session.user.name ?? "회원"}님
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          참여 중인 조직과 출석 일정을 한눈에 관리하세요.
        </p>
      </section>

      <OrgActions />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">내 조직</h2>
        {orgs.length === 0 ? (
          <p className="text-sm text-slate-500">
            아직 참여한 조직이 없습니다. 조직을 만들거나 초대 코드로 참여하세요.
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
                    {entry.role === "MANAGER" ? "매니저" : "회원"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {entry.organization?.description ?? "설명이 없습니다."}
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  초대 코드: {entry.organization?.invite_code}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
