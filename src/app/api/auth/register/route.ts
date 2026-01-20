import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "@/lib/passwords";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input" },
      { status: 400 }
    );
  }
  if (!parsed.data.termsAccepted || !parsed.data.privacyAccepted) {
    return NextResponse.json({ error: "Consent required" }, { status: 400 });
  }

  if (typeof body?.verificationId !== "string") {
    return NextResponse.json({ error: "Verification required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const email = parsed.data.email.toLowerCase();
  const { data: existing } = await supabase
    .from("users")
    .select("id, email_verified_at")
    .eq("email", email)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const { data: verification } = await supabase
    .from("email_verification_tokens")
    .select("id, email, expires_at, consumed_at")
    .eq("id", body.verificationId)
    .single();

  if (
    !verification ||
    verification.email !== email ||
    !verification.consumed_at ||
    new Date(verification.expires_at).getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "Verification required" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      name: parsed.data.name,
      email,
      image_url: null,
      terms_accepted_at: new Date().toISOString(),
      privacy_accepted_at: new Date().toISOString(),
      email_verified_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }

  const { error: credentialError } = await supabase
    .from("user_credentials")
    .insert({
      user_id: user.id,
      password_hash: passwordHash,
    });

  if (credentialError) {
    return NextResponse.json(
      { error: "Failed to save credentials" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
