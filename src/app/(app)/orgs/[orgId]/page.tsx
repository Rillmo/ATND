import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import LeaveOrgButton from "@/components/LeaveOrgButton";
import RemoveMemberButton from "@/components/RemoveMemberButton";
import TransferManagerForm from "@/components/TransferManagerForm";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookie } from "@/lib/i18n-server";

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const locale = await getLocaleFromCookie();
  const dictionary = getDictionary(locale);

  const { orgId } = await params;
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
    redirect("/dashboard");
  }

  const { data: org } = (await supabase
    .from("organizations")
    .select("id, name, description, image_url, invite_code, manager_user_id")
    .eq("id", orgId)
    .single()) as {
    data: {
      id: string;
      name: string;
      description: string | null;
      image_url: string | null;
      invite_code: string;
      manager_user_id: string;
    } | null;
  };

  if (!org) {
    redirect("/dashboard");
  }

  const { data: members } = (await supabase
    .from("organization_members")
    .select("role, users ( id, name, email, image_url )")
    .eq("org_id", orgId)
    .order("role", { ascending: false })) as {
    data: Array<{
      role: "MANAGER" | "MEMBER";
      users: {
        id: string;
        name: string | null;
        email: string | null;
        image_url: string | null;
      } | null;
    }> | null;
  };

  const { data: events } = (await supabase
    .from("events")
    .select(
      "id, title, attendance_start_at, attendance_end_at, event_date, location_name"
    )
    .eq("org_id", orgId)
    .order("attendance_start_at", { ascending: true })) as {
    data: Array<{
      id: string;
      title: string;
      attendance_start_at: string;
      attendance_end_at: string;
      event_date: string;
      location_name: string | null;
    }> | null;
  };

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
      <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {org.name}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {org.description ?? dictionary.org.noDescription}
            </p>
            <p className="mt-4 text-xs text-slate-500">
              {dictionary.org.inviteCodeLabel}:{" "}
              <span className="font-semibold">{org.invite_code}</span>
            </p>
          </div>
          <div className="space-y-3 text-right">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {isManager
                ? dictionary.dashboard.roleManager
                : dictionary.dashboard.roleMember}
            </span>
            <LeaveOrgButton orgId={orgId} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              {dictionary.org.events}
            </h2>
            {isManager ? (
              <Link
                href={`/orgs/${orgId}/events/new`}
                className="rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
              >
                {dictionary.org.createEvent}
              </Link>
            ) : null}
          </div>
          {eventRows.length === 0 ? (
            <p className="text-sm text-slate-500">
              {dictionary.org.noEvents}
            </p>
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
                      {event.event_date} ·{" "}
                      {event.location_name ?? dictionary.event.locationUnset}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {event.status === "ONGOING"
                      ? dictionary.org.statusOngoing
                      : event.status === "ENDED"
                      ? dictionary.org.statusEnded
                      : dictionary.org.statusUpcoming}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              {dictionary.org.members}
            </h2>
            <span className="text-xs text-slate-500">
              {members?.length ?? 0}
              {dictionary.org.memberCount}
            </span>
          </div>
          <div className="space-y-3 rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
            {(members ?? []).map((member) => (
              <div
                key={member.users?.id}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {member.users?.name ??
                      member.users?.email ??
                      dictionary.dashboard.roleMember}
                  </p>
                  <p className="text-xs text-slate-500">
                    {member.users?.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {member.role === "MANAGER"
                      ? dictionary.dashboard.roleManager
                      : dictionary.dashboard.roleMember}
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
            <div className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
              <TransferManagerForm orgId={orgId} members={members ?? []} />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
