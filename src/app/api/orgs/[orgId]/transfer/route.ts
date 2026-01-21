import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logApiError } from "@/lib/api-logger";
import { z } from "zod";

const transferSchema = z.object({
  newManagerUserId: z.string().uuid(),
});

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
  const parsed = transferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: org } = await supabase
    .from("organizations")
    .select("manager_user_id")
    .eq("id", orgId)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (org.manager_user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: newManager } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("user_id", parsed.data.newManagerUserId)
    .single();

  if (!newManager) {
    return NextResponse.json(
      { error: "New manager must be a member" },
      { status: 400 }
    );
  }

  const { error: updateOrgError } = await supabase
    .from("organizations")
    .update({ manager_user_id: parsed.data.newManagerUserId })
    .eq("id", orgId);

  if (updateOrgError) {
    logApiError("orgs.transfer.update_org", updateOrgError, {
      userId: session.user.id,
      orgId,
      newManagerUserId: parsed.data.newManagerUserId,
    });
    return NextResponse.json({ error: "Failed to transfer" }, { status: 500 });
  }

  const { error: eventOwnerError } = await supabase
    .from("events")
    .update({ created_by: parsed.data.newManagerUserId })
    .eq("org_id", orgId)
    .eq("created_by", session.user.id);

  if (eventOwnerError) {
    logApiError("orgs.transfer.update_events", eventOwnerError, {
      userId: session.user.id,
      orgId,
      newManagerUserId: parsed.data.newManagerUserId,
    });
    return NextResponse.json(
      { error: "Failed to transfer events" },
      { status: 500 }
    );
  }

  const { error: demoteError } = await supabase
    .from("organization_members")
    .update({ role: "MEMBER" })
    .eq("org_id", orgId)
    .eq("user_id", session.user.id);

  if (demoteError) {
    logApiError("orgs.transfer.demote_manager", demoteError, {
      userId: session.user.id,
      orgId,
    });
    return NextResponse.json({ error: "Failed to transfer" }, { status: 500 });
  }

  const { error: promoteError } = await supabase
    .from("organization_members")
    .update({ role: "MANAGER" })
    .eq("org_id", orgId)
    .eq("user_id", parsed.data.newManagerUserId);

  if (promoteError) {
    logApiError("orgs.transfer.promote_manager", promoteError, {
      userId: session.user.id,
      orgId,
      newManagerUserId: parsed.data.newManagerUserId,
    });
    return NextResponse.json({ error: "Failed to transfer" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
