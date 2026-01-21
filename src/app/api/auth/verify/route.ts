import { NextResponse } from "next/server";
import { z } from "zod";
import { logApiError } from "@/lib/api-logger";
import { verifyEmailToken } from "@/lib/verification";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const result = await verifyEmailToken(
      parsed.data.email,
      parsed.data.code
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      verificationId: result.verificationId,
    });
  } catch (error) {
    logApiError("auth.verify", error, { email: parsed.data.email });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
