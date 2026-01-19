import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { profileUpdateSchema } from "@/lib/validation";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, image_url")
    .eq("id", session.user.id)
    .single();

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: orgs } = await supabase
    .from("organization_members")
    .select("organizations ( id, name )")
    .eq("user_id", session.user.id);

  const organizations = (orgs ?? []).map((row) => row.organizations);

  return NextResponse.json({
    user,
    organizations,
  });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("users")
    .update({
      name: parsed.data.name,
      image_url: parsed.data.imageUrl ?? undefined,
    })
    .eq("id", session.user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
