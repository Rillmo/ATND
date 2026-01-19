import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import LeaveOrgButton from "@/components/LeaveOrgButton";
import RemoveMemberButton from "@/components/RemoveMemberButton";
import TransferManagerForm from "@/components/TransferManagerForm";

function eventStatusLabel(status: string) {
  if (status === "ONGOING") return "진행 중";
  if (status === "ENDED") return "종료";
  return "예정";
}

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { orgId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", session.user.id)
    .single();

  if (!membership) {
    redirect("/dashboard");
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, description, image_url, invite_code, manager_user_id")
    .eq("id", orgId)
    .single();

  if (!org) {
    redirect("/dashboard");
  }

  const { data: members } = await supabase
    .from("organization_members")
    .select("role, users ( id, name, email, image_url )")
    .eq("org_id", orgId)
    .order("role", { ascending: false });

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, attendance_start_at, attendance_end_at, event_date, location_name"
    )
    .eq("org_id", orgId)
    .order("attendance_start_at", { ascending: true });

  const now = new Date();
  const eventRows = (events ?? []).map((event) => {
    const start = new Date(event.attendance_start_at);
    const end = new Date(event.attendance_end_at);
    const status = now < start ? "UPCOMING" : now > end ? "ENDED" : "ONGOING";

    return { ...event, status };
  });

  const isManager = membership.role === "MANAGER";

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-200/70">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {org.name}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {org.description ?? "조직 설명이 없습니다."}
            </p>
            <p className="mt-4 text-xs text-slate-500">
              초대 코드: <span className="font-semibold">{org.invite_code}</span>
            </p>
          </div>
          <div className="space-y-3 text-right">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {isManager ? "매니저" : "회원"}
            </span>
            <LeaveOrgButton orgId={orgId} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">일정</h2>
            {isManager ? (
              <Link
                href={`/orgs/${orgId}/events/new`}
                className="rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
              >
                일정 생성
              </Link>
            ) : null}
          </div>
          {eventRows.length === 0 ? (
            <p className="text-sm text-slate-500">등록된 일정이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {eventRows.map((event) => (
                <Link
                  key={event.id}
                  href={`/orgs/${orgId}/events/${event.id}`}
                  className="flex items-center justify-between rounded-2xl bg-white/90 px-5 py-4 shadow-sm ring-1 ring-slate-200/70"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {event.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {event.event_date} · {event.location_name ?? "장소 미지정"}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {eventStatusLabel(event.status)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">회원</h2>
            <span className="text-xs text-slate-500">{members?.length ?? 0}명</span>
          </div>
          <div className="space-y-3 rounded-2xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70">
            {(members ?? []).map((member) => (
              <div
                key={member.users?.id}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {member.users?.name ?? "이름 없음"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {member.users?.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {member.role === "MANAGER" ? "매니저" : "회원"}
                  </span>
                  {isManager && member.role !== "MANAGER" ? (
                    <RemoveMemberButton
                      orgId={orgId}
                      userId={member.users?.id ?? ""}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {isManager ? (
            <div className="rounded-2xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70">
              <TransferManagerForm orgId={orgId} members={members ?? []} />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
