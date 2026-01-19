import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import EventEditForm from "@/components/EventEditForm";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookie } from "@/lib/i18n-server";

export default async function EventEditPage({
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
    .single()) as { data: { role: "MANAGER" | "MEMBER" } | null };

  if (!membership || membership.role !== "MANAGER") {
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

  if (new Date(event.attendance_start_at) <= new Date()) {
    redirect(`/orgs/${orgId}/events/${eventId}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">
        {dictionary.event.editTitle}
      </h1>
      <EventEditForm orgId={orgId} eventId={eventId} initialEvent={event} />
    </div>
  );
}
