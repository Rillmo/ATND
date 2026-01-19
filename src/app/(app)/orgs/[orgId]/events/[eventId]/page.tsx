import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import CheckInButton from "@/components/CheckInButton";

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { orgId, eventId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", session.user.id)
    .single();

  if (!membership) {
    redirect(`/orgs/${orgId}`);
  }

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, event_date, attendance_start_at, attendance_end_at, radius_meters, location_name, location_address, latitude, longitude"
    )
    .eq("org_id", orgId)
    .eq("id", eventId)
    .single();

  if (!event) {
    redirect(`/orgs/${orgId}`);
  }

  const { data: attendanceRecord } = await supabase
    .from("attendances")
    .select("status, checked_in_at")
    .eq("event_id", eventId)
    .eq("user_id", session.user.id)
    .single();

  const now = new Date();
  const end = new Date(event.attendance_end_at);
  const start = new Date(event.attendance_start_at);

  let myStatus = "NOT_ATTENDED";
  if (attendanceRecord?.status === "ATTENDED") {
    myStatus = "ATTENDED";
  } else if (now > end) {
    myStatus = "ABSENT";
  }

  const { data: members } = membership.role === "MANAGER"
    ? await supabase
        .from("organization_members")
        .select("user_id, role, users ( id, name, email )")
        .eq("org_id", orgId)
    : { data: [] };

  const { data: attendance } = membership.role === "MANAGER"
    ? await supabase
        .from("attendances")
        .select("user_id, status, checked_in_at")
        .eq("event_id", eventId)
    : { data: [] };

  const attendanceByUser = new Map(
    (attendance ?? []).map((entry) => [entry.user_id, entry])
  );

  const memberAttendance = (members ?? []).map((member) => {
    const record = attendanceByUser.get(member.user_id);
    let status = "NOT_ATTENDED";
    if (record?.status === "ATTENDED") {
      status = "ATTENDED";
    } else if (now > end) {
      status = "ABSENT";
    }

    return {
      user: member.users,
      status,
      checkedInAt: record?.checked_in_at ?? null,
    };
  });

  const windowLabel = now < start ? "출석 시작 전" : now > end ? "종료" : "출석 가능";

  return (
    <div className="space-y-8">
      <Link
        href={`/orgs/${orgId}`}
        className="text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        ← 조직으로 돌아가기
      </Link>
      <section className="rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-200/70">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {event.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {event.event_date} · {event.location_name ?? "장소 미지정"}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              출석 가능 시간: {formatDateTime(event.attendance_start_at)} ~{" "}
              {formatDateTime(event.attendance_end_at)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              반경 {event.radius_meters}m 내에서 체크인 가능
            </p>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {windowLabel}
            </span>
            <p className="mt-3 text-xs text-slate-500">
              내 출석 상태: {myStatus}
            </p>
            {attendanceRecord?.checked_in_at ? (
              <p className="text-xs text-slate-500">
                체크인 시각: {formatDateTime(attendanceRecord.checked_in_at)}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6">
          <CheckInButton orgId={orgId} eventId={eventId} />
        </div>
      </section>

      {membership.role === "MANAGER" ? (
        <section className="rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-200/70">
          <h2 className="text-xl font-semibold text-slate-900">출석 현황</h2>
          <div className="mt-4 space-y-3">
            {memberAttendance.map((entry) => (
              <div
                key={entry.user?.id}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {entry.user?.name ?? entry.user?.email ?? "회원"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {entry.checkedInAt
                      ? `체크인: ${formatDateTime(entry.checkedInAt)}`
                      : "체크인 기록 없음"}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
