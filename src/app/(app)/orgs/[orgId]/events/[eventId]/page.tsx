import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import CheckInButton from "@/components/CheckInButton";
import DateTimeText from "@/components/DateTimeText";
import EventLocationMap from "@/components/EventLocationMap";
import EventDeleteButton from "@/components/EventDeleteButton";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookie } from "@/lib/i18n-server";

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

  const { data: membership } = (await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", session.user.id)
    .single()) as {
    data: { role: "MANAGER" | "MEMBER" } | null;
  };

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

  const { data: attendanceRecord } = (await supabase
    .from("attendances")
    .select("status, checked_in_at")
    .eq("event_id", eventId)
    .eq("user_id", session.user.id)
    .single()) as {
    data: { status: "ATTENDED" | "NOT_ATTENDED" | "ABSENT"; checked_in_at: string | null } | null;
  };

  const now = new Date();
  const end = new Date(event.attendance_end_at);
  const start = new Date(event.attendance_start_at);

  const { data: members } = (await supabase
    .from("organization_members")
    .select("user_id, role, users ( id, name, email )")
    .eq("org_id", orgId)) as {
    data: Array<{
      user_id: string;
      role: "MANAGER" | "MEMBER";
      users: { id: string; name: string | null; email: string | null } | null;
    }> | null;
  };

  const { data: attendance } = (await supabase
    .from("attendances")
    .select("user_id, status, checked_in_at")
    .eq("event_id", eventId)) as {
    data: Array<{
      user_id: string;
      status: "ATTENDED" | "NOT_ATTENDED" | "ABSENT";
      checked_in_at: string | null;
    }> | null;
  };

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

  const attendedMembers = memberAttendance.filter(
    (entry) => entry.status === "ATTENDED"
  );
  const notAttendedMembers = memberAttendance.filter(
    (entry) => entry.status !== "ATTENDED"
  );

  const windowLabel =
    now < start
      ? dictionary.status.checkinBefore
      : now > end
      ? dictionary.status.checkinClosed
      : dictionary.status.checkinOpen;
  const canCheckIn = now >= start && now <= end;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/orgs/${orgId}`}
          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          ← {dictionary.org.backToOrg}
        </Link>
        {membership.role === "MANAGER" && now < end ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/orgs/${orgId}/events/${eventId}/edit`}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
            >
              {dictionary.event.editTitle}
            </Link>
            {now < start ? (
              <EventDeleteButton orgId={orgId} eventId={eventId} />
            ) : null}
          </div>
        ) : null}
      </div>
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
              <DateTimeText value={event.attendance_start_at} /> ~{" "}
              <DateTimeText value={event.attendance_end_at} />
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {dictionary.event.radius}: {event.radius_meters}m
            </p>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {windowLabel}
            </span>
            {attendanceRecord?.checked_in_at ? (
              <p className="text-xs text-slate-500">
                {dictionary.event.checkedAt}:{" "}
                <DateTimeText value={attendanceRecord.checked_in_at} />
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6">
          <CheckInButton
            orgId={orgId}
            eventId={eventId}
            checkedIn={attendanceRecord?.status === "ATTENDED"}
            canCheckIn={canCheckIn}
          />
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

      <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">
          {dictionary.event.managerAttendance}
        </h2>
        <div className="mt-4 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>{dictionary.event.attendedGroup}</span>
              <span>{attendedMembers.length}</span>
            </div>
            {attendedMembers.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                {dictionary.event.noCheckin}
              </div>
            ) : (
              attendedMembers.map((entry) => (
                <div
                  key={entry.user?.id}
                  className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {entry.user?.name ??
                        entry.user?.email ??
                        dictionary.dashboard.roleMember}
                    </p>
                    <p className="text-xs text-slate-500">
                      {entry.checkedInAt
                        ? `${dictionary.event.checkedAt}: `
                        : dictionary.event.noCheckin}
                      {entry.checkedInAt ? (
                        <DateTimeText value={entry.checkedInAt} />
                      ) : null}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                    {dictionary.status.attended}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>{dictionary.event.notAttendedGroup}</span>
              <span>{notAttendedMembers.length}</span>
            </div>
            {notAttendedMembers.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                {dictionary.status.attended}
              </div>
            ) : (
              notAttendedMembers.map((entry) => (
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
                        ? `${dictionary.event.checkedAt}: `
                        : dictionary.event.noCheckin}
                      {entry.checkedInAt ? (
                        <DateTimeText value={entry.checkedInAt} />
                      ) : null}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {entry.status === "ABSENT"
                      ? dictionary.status.absent
                      : dictionary.status.notAttended}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
