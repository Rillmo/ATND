import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { issuePasswordReset } from "@/lib/password-reset";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const supabase = getSupabaseAdmin();
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    // Do not leak existence; only send if user is present.
    if (user?.id) {
      await issuePasswordReset(email);
    }

    return NextResponse.json({ ok: true, sent: true });
  } catch (error) {
    console.error("[auth:password-reset:request] failed", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
