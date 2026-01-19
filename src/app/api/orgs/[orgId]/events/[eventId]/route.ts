import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { eventSchema } from "@/lib/validation";

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

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, event_date, attendance_start_at, attendance_end_at, radius_meters, location_name, location_address, latitude, longitude, created_by"
    )
    .eq("org_id", orgId)
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ event });
}

export async function PATCH(
  request: Request,
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

  const { data: existing } = await supabase
    .from("events")
    .select("attendance_start_at")
    .eq("org_id", orgId)
    .eq("id", eventId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (new Date(existing.attendance_start_at) <= new Date()) {
    return NextResponse.json(
      { error: "Cannot edit after attendance starts" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const start = new Date(parsed.data.attendanceStartAt);
  const end = new Date(parsed.data.attendanceEndAt);

  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    return NextResponse.json({ error: "Invalid time" }, { status: 400 });
  }

  if (end <= start) {
    return NextResponse.json(
      { error: "End time must be after start" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("events")
    .update({
      title: parsed.data.title,
      event_date: parsed.data.eventDate,
      attendance_start_at: parsed.data.attendanceStartAt,
      attendance_end_at: parsed.data.attendanceEndAt,
      radius_meters: parsed.data.radiusMeters,
      location_name: parsed.data.locationName ?? null,
      location_address: parsed.data.locationAddress ?? null,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    })
    .eq("org_id", orgId)
    .eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
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

  const { data: existing } = await supabase
    .from("events")
    .select("attendance_start_at")
    .eq("org_id", orgId)
    .eq("id", eventId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (new Date(existing.attendance_start_at) <= new Date()) {
    return NextResponse.json(
      { error: "Cannot delete after attendance starts" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("org_id", orgId)
    .eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
