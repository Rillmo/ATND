import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import ConsentForm from "@/components/ConsentForm";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookie } from "@/lib/i18n-server";

function resolveCallbackUrl(raw?: string | string[] | null) {
  if (Array.isArray(raw)) {
    raw = raw[0];
  }
  if (typeof raw === "string" && raw.startsWith("/")) {
    return raw;
  }
  return "/dashboard";
}

export default async function ConsentPage({
  searchParams,
}: {
  searchParams:
    | { callbackUrl?: string }
    | Promise<{ callbackUrl?: string | string[] | null }>;
}) {
  const resolvedParams = await searchParams;
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const locale = await getLocaleFromCookie();
  const dictionary = getDictionary(locale);
  const supabase = getSupabaseAdmin();
  const callbackUrl = resolveCallbackUrl(resolvedParams?.callbackUrl ?? null);

  const { data: user } = (await supabase
    .from("users")
    .select("privacy_accepted_at, terms_accepted_at")
    .eq("id", session.user.id)
    .single()) as {
    data: { privacy_accepted_at: string | null; terms_accepted_at: string | null } | null;
  };

  const hasConsent = Boolean(
    user?.privacy_accepted_at && user?.terms_accepted_at
  );

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">
        {dictionary.auth.consentTitle}
      </h1>
      <p className="text-sm text-slate-600">
        {dictionary.auth.consentSubtitle}
      </p>
      {hasConsent ? (
        <div className="space-y-4 text-sm text-slate-700">
          <p>{dictionary.auth.consentContinue}</p>
          <a
            href={callbackUrl}
            className="block rounded-full bg-slate-900 px-4 py-2 text-center font-semibold text-white hover:bg-slate-800"
          >
            {dictionary.auth.consentContinue}
          </a>
        </div>
      ) : (
        <ConsentForm callbackUrl={callbackUrl} />
      )}
    </div>
  );
}
