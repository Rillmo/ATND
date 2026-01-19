import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { eventSchema } from "@/lib/validation";

function getEventStatus(now: Date, start: Date, end: Date) {
  if (now < start) return "UPCOMING";
  if (now > end) return "ENDED";
  return "ONGOING";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, title, event_date, attendance_start_at, attendance_end_at, radius_meters, location_name, location_address, latitude, longitude, created_by"
    )
    .eq("org_id", orgId)
    .order("attendance_start_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }

  const now = new Date();
  const result = (events ?? []).map((event) => ({
    ...event,
    status: getEventStatus(
      now,
      new Date(event.attendance_start_at),
      new Date(event.attendance_end_at)
    ),
  }));

  return NextResponse.json({ events: result });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const start = new Date(parsed.data.attendanceStartAt);
  const end = new Date(parsed.data.attendanceEndAt);
  const now = new Date();

  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    return NextResponse.json({ error: "Invalid time" }, { status: 400 });
  }

  if (start < now) {
    return NextResponse.json(
      { error: "Start time must be in the future" },
      { status: 400 }
    );
  }

  if (end <= start) {
    return NextResponse.json(
      { error: "End time must be after start" },
      { status: 400 }
    );
  }

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

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      org_id: orgId,
      title: parsed.data.title,
      event_date: parsed.data.eventDate,
      attendance_start_at: parsed.data.attendanceStartAt,
      attendance_end_at: parsed.data.attendanceEndAt,
      radius_meters: parsed.data.radiusMeters,
      location_name: parsed.data.locationName ?? null,
      location_address: parsed.data.locationAddress ?? null,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      created_by: session.user.id,
    })
    .select("id")
    .single();

  if (error || !event) {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }

  return NextResponse.json({ id: event.id });
}
