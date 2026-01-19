import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkInSchema } from "@/lib/validation";
import { calculateDistanceMeters } from "@/lib/geo";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string; eventId: string }> }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId, eventId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", session.user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: event } = await supabase
    .from("events")
    .select(
      "attendance_start_at, attendance_end_at, radius_meters, latitude, longitude"
    )
    .eq("org_id", orgId)
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const start = new Date(event.attendance_start_at);
  const end = new Date(event.attendance_end_at);

  if (now < start || now > end) {
    return NextResponse.json(
      { error: "Attendance window closed" },
      { status: 400 }
    );
  }

  const distance = calculateDistanceMeters(
    parsed.data.latitude,
    parsed.data.longitude,
    event.latitude,
    event.longitude
  );

  if (distance > event.radius_meters) {
    return NextResponse.json(
      { error: "Outside attendance radius" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("attendances")
    .upsert(
      {
        event_id: eventId,
        user_id: session.user.id,
        status: "ATTENDED",
        checked_in_at: now.toISOString(),
        checked_in_latitude: parsed.data.latitude,
        checked_in_longitude: parsed.data.longitude,
      },
      { onConflict: "event_id,user_id" }
    );

  if (error) {
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
