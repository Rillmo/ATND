import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

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

  const { data: members, error } = (await supabase
    .from("organization_members")
    .select("role, users ( id, name, email, image_url )")
    .eq("org_id", orgId)) as {
    data:
      | Array<{
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

  if (error) {
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }

  const result = (members ?? []).map((member) => ({
    role: member.role,
    user: member.users,
  }));

  return NextResponse.json({ members: result });
}
