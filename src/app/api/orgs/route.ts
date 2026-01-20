import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateInviteCode } from "@/lib/invite";
import { orgCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = (await supabase
      .from("organization_members")
      .select(
        "role, organizations ( id, name, description, image_url, invite_code, manager_user_id, created_at )"
      )
      .eq("user_id", session.user.id)) as {
      data:
        | Array<{
            role: "MANAGER" | "MEMBER";
            organizations: {
              id: string;
              name: string;
              description: string | null;
              image_url: string | null;
              invite_code: string;
              manager_user_id: string;
              created_at: string;
            } | null;
          }>
        | null;
      error: { message: string } | null;
    };

    if (error) {
      console.error("orgs.get.error", error);
      return NextResponse.json(
        { error: "Failed to load orgs" },
        { status: 500 }
      );
    }

    const orgs = (data ?? []).map((row) => ({
      role: row.role,
      organization: row.organizations,
    }));

    return NextResponse.json({ orgs });
  } catch (err) {
    console.error("orgs.get.exception", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = orgCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const inviteCode = generateInviteCode();

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        image_url: parsed.data.imageUrl ?? null,
        invite_code: inviteCode,
        manager_user_id: session.user.id,
      })
      .select("id")
      .single();

    if (orgError || !org) {
      console.error("orgs.create.error", orgError);
      return NextResponse.json(
        { error: "Failed to create org" },
        { status: 500 }
      );
    }

    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        org_id: org.id,
        user_id: session.user.id,
        role: "MANAGER",
      });

    if (memberError) {
      console.error("orgs.create.member.error", memberError);
      return NextResponse.json(
        { error: "Failed to create membership" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: org.id });
  } catch (err) {
    console.error("orgs.create.exception", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
