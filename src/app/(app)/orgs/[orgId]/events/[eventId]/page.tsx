import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import CheckInButton from "@/components/CheckInButton";
import EventLocationMap from "@/components/EventLocationMap";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookie } from "@/lib/i18n-server";

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

  const locale = await getLocaleFromCookie();
  const dictionary = getDictionary(locale);

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

  const { data: event } = (await supabase
    .from("events")
    .select(
      "id, title, event_date, attendance_start_at, attendance_end_at, radius_meters, location_name, location_address, latitude, longitude"
    )
    .eq("org_id", orgId)
    .eq("id", eventId)
    .single()) as {
    data: {
      id: string;
      title: string;
      event_date: string;
      attendance_start_at: string;
      attendance_end_at: string;
      radius_meters: number;
      location_name: string | null;
      location_address: string | null;
      latitude: number;
      longitude: number;
    } | null;
  };

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

  const windowLabel =
    now < start
      ? dictionary.status.checkinBefore
      : now > end
      ? dictionary.status.checkinClosed
      : dictionary.status.checkinOpen;

  return (
    <div className="space-y-8">
      <Link
        href={`/orgs/${orgId}`}
        className="text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        ← {dictionary.org.backToOrg}
      </Link>
      <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {event.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {event.event_date} ·{" "}
              {event.location_name ?? dictionary.event.locationUnset}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {dictionary.event.windowLabel}:{" "}
              {formatDateTime(event.attendance_start_at)} ~{" "}
              {formatDateTime(event.attendance_end_at)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {dictionary.event.radius}: {event.radius_meters}m
            </p>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {windowLabel}
            </span>
            <p className="mt-3 text-xs text-slate-500">
              {dictionary.event.myStatus}:{" "}
              {myStatus === "ATTENDED"
                ? dictionary.status.attended
                : myStatus === "ABSENT"
                ? dictionary.status.absent
                : dictionary.status.notAttended}
            </p>
            {attendanceRecord?.checked_in_at ? (
              <p className="text-xs text-slate-500">
                {dictionary.event.checkedAt}:{" "}
                {formatDateTime(attendanceRecord.checked_in_at)}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6">
          <CheckInButton orgId={orgId} eventId={eventId} />
        </div>
      </section>

      <EventLocationMap
        title={event.location_name ?? dictionary.event.locationUnset}
        address={event.location_address}
        latitude={event.latitude}
        longitude={event.longitude}
        radiusMeters={event.radius_meters}
        labels={{
          mapLoading: dictionary.event.mapLoading,
          mapError: dictionary.event.mapError,
          radius: dictionary.event.radius,
        }}
      />

      {membership.role === "MANAGER" ? (
        <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900">
            {dictionary.event.managerAttendance}
          </h2>
          <div className="mt-4 space-y-3">
            {memberAttendance.map((entry) => (
              <div
                key={entry.user?.id}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {entry.user?.name ??
                      entry.user?.email ??
                      dictionary.dashboard.roleMember}
                  </p>
                  <p className="text-xs text-slate-500">
                    {entry.checkedInAt
                      ? `${dictionary.event.checkedAt}: ${formatDateTime(
                          entry.checkedInAt
                        )}`
                      : dictionary.event.noCheckin}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {entry.status === "ATTENDED"
                    ? dictionary.status.attended
                    : entry.status === "ABSENT"
                    ? dictionary.status.absent
                    : dictionary.status.notAttended}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
