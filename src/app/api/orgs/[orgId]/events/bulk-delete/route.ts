import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { orgId } = await params;
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

  const ids = parsed.data.ids;
  const nowIso = new Date().toISOString();

  const { data: events, error: fetchError } = await supabase
    .from("events")
    .select("id, attendance_start_at")
    .eq("org_id", orgId)
    .in("id", ids);

  if (fetchError) {
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }

  const deletableIds =
    events?.filter((event) => event.attendance_start_at > nowIso).map((e) => e.id) ??
    [];

  if (deletableIds.length === 0) {
    return NextResponse.json(
      { error: "No deletable events (already started or not found)" },
      { status: 400 }
    );
  }

  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .eq("org_id", orgId)
    .in("id", deletableIds);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return NextResponse.json({ deleted: deletableIds.length, requested: ids.length });
}
