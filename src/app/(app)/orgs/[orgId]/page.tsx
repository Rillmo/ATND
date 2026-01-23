import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import LeaveOrgButton from "@/components/LeaveOrgButton";
import TransferManagerForm from "@/components/TransferManagerForm";
import EventList from "@/components/EventList";
import MemberList from "@/components/MemberList";
import OrgDeleteButton from "@/components/OrgDeleteButton";
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

    return { ...event, status: status as "UPCOMING" | "ONGOING" | "ENDED" };
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
            <div className="pt-2">
              <LeaveOrgButton orgId={orgId} />
            </div>
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
            <EventList orgId={orgId} events={eventRows} isManager={isManager} />
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
          <MemberList
            orgId={orgId}
            members={members ?? []}
            isManager={isManager}
          />
          {isManager ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
                <TransferManagerForm
                  orgId={orgId}
                  members={(members ?? []).map((member) => ({
                    role: member.role,
                    user: member.users,
                  }))}
                />
              </div>
              <div className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5">
                <OrgDeleteButton orgId={orgId} />
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
