import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logApiError } from "@/lib/api-logger";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; eventId: string }> }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId, eventId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", session.user.id)
    .single();

  if (!membership || membership.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("attendance_end_at")
    .eq("org_id", orgId)
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: members, error: memberError } = (await supabase
    .from("organization_members")
    .select("user_id, role, users ( id, name, email, image_url )")
    .eq("org_id", orgId)) as {
    data:
      | Array<{
          user_id: string;
          role: "MANAGER" | "MEMBER";
          users: {
            id: string;
            name: string | null;
            email: string | null;
            image_url: string | null;
          } | null;
        }>
      | null;
    error: { message: string } | null;
  };

  if (memberError) {
    logApiError("events.attendance.list", memberError, {
      userId: session.user.id,
      orgId,
      eventId,
    });
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }

  const { data: attendance } = (await supabase
    .from("attendances")
    .select("user_id, status, checked_in_at")
    .eq("event_id", eventId)) as {
    data:
      | Array<{
          user_id: string;
          status: "NOT_ATTENDED" | "ATTENDED" | "ABSENT";
          checked_in_at: string | null;
        }>
      | null;
  };

  const attendanceByUser = new Map(
    (attendance ?? []).map((entry) => [entry.user_id, entry])
  );

  const now = new Date();
  const end = new Date(event.attendance_end_at);

  const result = (members ?? []).map((member) => {
    const record = attendanceByUser.get(member.user_id);
    let status = "NOT_ATTENDED";

    if (record?.status === "ATTENDED") {
      status = "ATTENDED";
    } else if (now > end) {
      status = "ABSENT";
    }

    return {
      user: member.users,
      role: member.role,
      status,
      checkedInAt: record?.checked_in_at ?? null,
    };
  });

  return NextResponse.json({ attendance: result });
}
