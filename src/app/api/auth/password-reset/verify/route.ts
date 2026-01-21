import { NextResponse } from "next/server";
import { z } from "zod";
import { logApiError } from "@/lib/api-logger";
import { passwordSchema } from "@/lib/validation";
import { verifyPasswordReset } from "@/lib/password-reset";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
  newPassword: passwordSchema,
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const result = await verifyPasswordReset({
      email: parsed.data.email,
      code: parsed.data.code,
      newPassword: parsed.data.newPassword,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logApiError("auth.password_reset.verify", error, {
      email: parsed.data.email,
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
