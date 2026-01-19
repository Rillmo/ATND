import { NextResponse } from "next/server";
import { normalizeLocale } from "@/lib/i18n";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const locale = normalizeLocale(body?.locale);

  const response = NextResponse.json({ ok: true });
  response.cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
