import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId, userId } = await params;
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

  if (org.manager_user_id === userId) {
    return NextResponse.json(
      { error: "Manager cannot be removed" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
