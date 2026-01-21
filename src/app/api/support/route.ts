import { NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { sendSupportEmail } from "@/lib/mailer";
import { logApiError } from "@/lib/api-logger";
import { supportRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = supportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    await sendSupportEmail({
      fromEmail: session.user.email,
      userId: session.user.id,
      subject: parsed.data.subject,
      message: parsed.data.message,
      userAgent: request.headers.get("user-agent"),
      ipAddress: request.headers.get("x-forwarded-for"),
    });
  } catch (error) {
    logApiError("support.send", error, { userId: session.user.id });
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
