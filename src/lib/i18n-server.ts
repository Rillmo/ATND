import { cookies, headers } from "next/headers";
import { normalizeLocale, type Locale } from "@/lib/i18n";

function parseLocaleFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith("locale=")) {
      return part.slice("locale=".length);
    }
  }
  return undefined;
}

export async function getLocaleFromCookie(): Promise<Locale> {
  let cookieValue: string | undefined;

  const cookieStore = await cookies();
  if (cookieStore && typeof cookieStore.get === "function") {
    cookieValue = cookieStore.get("locale")?.value;
  }

  if (!cookieValue) {
    const headerStore = await headers();
    const headerValue =
      headerStore && typeof headerStore.get === "function"
        ? headerStore.get("cookie")
        : null;
    cookieValue = parseLocaleFromCookieHeader(headerValue);
  }

  return normalizeLocale(cookieValue);
}
