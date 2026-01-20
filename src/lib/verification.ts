import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendVerificationEmail } from "@/lib/mailer";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

export async function issueEmailVerification(email: string) {
  const code = generateCode();
  const tokenHash = hashToken(code);
  const supabase = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  const normalizedEmail = email.toLowerCase();

  // Remove prior pending tokens for this user to keep one active token.
  await supabase
    .from("email_verification_tokens")
    .delete()
    .eq("email", normalizedEmail)
    .is("consumed_at", null);

  const { error } = await supabase
    .from("email_verification_tokens")
    .insert({
      email: normalizedEmail,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

  if (error) {
    throw new Error(`Failed to create verification token: ${error.message}`);
  }

  await sendVerificationEmail({ to: normalizedEmail, code });
}

export async function verifyEmailToken(email: string, code: string) {
  const tokenHash = hashToken(code);
  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  const normalizedEmail = email.toLowerCase();

  const { data: record, error } = await supabase
    .from("email_verification_tokens")
    .select("id, expires_at, consumed_at")
    .eq("email", normalizedEmail)
    .eq("token_hash", tokenHash)
    .is("consumed_at", null)
    .single();

  if (error || !record) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (record.consumed_at) {
    return { ok: false as const, reason: "used" as const };
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    return { ok: false as const, reason: "expired" as const };
  }

  const { error: consumeError } = await supabase
    .from("email_verification_tokens")
    .update({ consumed_at: nowIso })
    .eq("id", record.id);

  if (consumeError) {
    return { ok: false as const, reason: "failed" as const };
  }

  return { ok: true as const, verificationId: record.id };
}
