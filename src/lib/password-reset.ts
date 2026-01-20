import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { hashPassword } from "@/lib/passwords";

const RESET_TTL_MS = 15 * 60 * 1000; // 15 minutes

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

export async function issuePasswordReset(email: string) {
  const code = generateCode();
  const tokenHash = hashToken(code);
  const supabase = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();
  const normalizedEmail = email.toLowerCase();

  // Ensure only one active token per email.
  await supabase
    .from("password_reset_tokens")
    .delete()
    .eq("email", normalizedEmail)
    .is("consumed_at", null);

  const { error } = await supabase.from("password_reset_tokens").insert({
    email: normalizedEmail,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to create password reset token: ${error.message}`);
  }

  await sendPasswordResetEmail({ to: normalizedEmail, code });
}

export async function verifyPasswordReset(params: {
  email: string;
  code: string;
  newPassword: string;
}) {
  const normalizedEmail = params.email.toLowerCase();
  const tokenHash = hashToken(params.code);
  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data: token, error: tokenError } = await supabase
    .from("password_reset_tokens")
    .select("id, expires_at, consumed_at")
    .eq("email", normalizedEmail)
    .eq("token_hash", tokenHash)
    .is("consumed_at", null)
    .single();

  if (tokenError || !token) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (token.consumed_at) {
    return { ok: false as const, reason: "used" as const };
  }

  if (new Date(token.expires_at).getTime() < Date.now()) {
    return { ok: false as const, reason: "expired" as const };
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .single();

  if (!user?.id) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const passwordHash = await hashPassword(params.newPassword);

  const { error: upsertError } = await supabase
    .from("user_credentials")
    .upsert({ user_id: user.id, password_hash: passwordHash }, { onConflict: "user_id" });

  if (upsertError) {
    return { ok: false as const, reason: "failed" as const };
  }

  // Consume this token and clean up any others.
  await supabase
    .from("password_reset_tokens")
    .update({ consumed_at: nowIso })
    .eq("id", token.id);

  await supabase
    .from("password_reset_tokens")
    .delete()
    .eq("email", normalizedEmail)
    .is("consumed_at", null);

  return { ok: true as const };
}
