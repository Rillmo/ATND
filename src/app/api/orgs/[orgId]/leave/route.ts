import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logApiError } from "@/lib/api-logger";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: org } = await supabase
    .from("organizations")
    .select("manager_user_id")
    .eq("id", orgId)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (org.manager_user_id === session.user.id) {
    return NextResponse.json(
      { error: "Manager must transfer before leaving" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", session.user.id);

  if (error) {
    logApiError("orgs.leave", error, {
      userId: session.user.id,
      orgId,
    });
    return NextResponse.json({ error: "Failed to leave" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
