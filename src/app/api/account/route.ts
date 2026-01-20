import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function DELETE() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const supabase = getSupabaseAdmin();

  const { data: managedOrgs, error: managedError } = await supabase
    .from("organizations")
    .select("id")
    .eq("manager_user_id", userId)
    .limit(1);

  if (managedError) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  if (managedOrgs && managedOrgs.length > 0) {
    return NextResponse.json({ error: "Manager" }, { status: 409 });
  }

  const { data: createdEvents, error: eventsError } = await supabase
    .from("events")
    .select("id, org_id, organizations(manager_user_id)")
    .eq("created_by", userId);

  if (eventsError) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  if (createdEvents && createdEvents.length > 0) {
    const typedEvents = createdEvents as Array<{
      id: string;
      organizations: { manager_user_id: string | null } | null;
    }>;

    const updates = typedEvents
      .map((event) => ({
        id: event.id,
        managerUserId: event.organizations?.manager_user_id ?? null,
      }))
      .filter((event) => Boolean(event.managerUserId));

    if (updates.length !== typedEvents.length) {
      return NextResponse.json({ error: "Events" }, { status: 409 });
    }

    for (const entry of updates) {
      const { error: updateError } = await supabase
        .from("events")
        .update({ created_by: entry.managerUserId })
        .eq("id", entry.id)
        .eq("created_by", userId);

      if (updateError) {
        return NextResponse.json({ error: "Events" }, { status: 409 });
      }
    }
  }

  const { error: deleteError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (deleteError) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
