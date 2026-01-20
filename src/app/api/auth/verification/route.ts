import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { issueEmailVerification } from "@/lib/verification";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", parsed.data.email.toLowerCase())
    .single();

  if (user) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  try {
    await issueEmailVerification(parsed.data.email.toLowerCase());
    return NextResponse.json({ ok: true, sent: true });
  } catch (error) {
    console.error("[auth:verification] failed to send", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
