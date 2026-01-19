import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { eventSchema, recurrenceSchema } from "@/lib/validation";

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

  const now = new Date();

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

  const recurrenceEnabled = Boolean(body?.recurrence);
  if (recurrenceEnabled) {
    const recurrenceParsed = recurrenceSchema.safeParse(body.recurrence);
    if (!recurrenceParsed.success) {
      return NextResponse.json({ error: "Invalid recurrence" }, { status: 400 });
    }

    const baseDateParts = parsed.data.eventDate.split("-").map(Number);
    if (baseDateParts.length !== 3) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const [year, month, day] = baseDateParts;
    const baseDate = new Date(year, month - 1, day);
    const baseIsoDay = ((baseDate.getDay() + 6) % 7) + 1;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - (baseIsoDay - 1));

    const startBase = new Date(parsed.data.attendanceStartAt);
    const endBase = new Date(parsed.data.attendanceEndAt);
    if (Number.isNaN(startBase.valueOf()) || Number.isNaN(endBase.valueOf())) {
      return NextResponse.json({ error: "Invalid time" }, { status: 400 });
    }
    const startHours = startBase.getHours();
    const startMinutes = startBase.getMinutes();
    const endHours = endBase.getHours();
    const endMinutes = endBase.getMinutes();

    const occurrences = [];
    for (let week = 0; week < recurrenceParsed.data.weeks; week += 1) {
      for (const weekday of recurrenceParsed.data.weekdays) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + (weekday - 1) + week * 7);
        const eventDate = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        const startAt = new Date(date);
        startAt.setHours(startHours, startMinutes, 0, 0);
        const endAt = new Date(date);
        endAt.setHours(endHours, endMinutes, 0, 0);
        if (endAt <= startAt) {
          endAt.setDate(endAt.getDate() + 1);
        }

        if (startAt < now) {
          return NextResponse.json(
            { error: "Start time must be in the future" },
            { status: 400 }
          );
        }

        occurrences.push({
          org_id: orgId,
          title: parsed.data.title,
          event_date: eventDate,
          attendance_start_at: startAt.toISOString(),
          attendance_end_at: endAt.toISOString(),
          radius_meters: parsed.data.radiusMeters,
          location_name: parsed.data.locationName ?? null,
          location_address: parsed.data.locationAddress ?? null,
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude,
          created_by: session.user.id,
        });
      }
    }

    if (occurrences.length === 0) {
      return NextResponse.json({ error: "No events generated" }, { status: 400 });
    }

    const { error } = await supabase.from("events").insert(occurrences);
    if (error) {
      return NextResponse.json(
        { error: "Failed to create events" },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: occurrences.length });
  }

  const start = new Date(parsed.data.attendanceStartAt);
  const end = new Date(parsed.data.attendanceEndAt);

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
