import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import ConsentForm from "@/components/ConsentForm";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookie } from "@/lib/i18n-server";

export default async function ConsentPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const locale = await getLocaleFromCookie();
  const dictionary = getDictionary(locale);
  const supabase = getSupabaseAdmin();

  const { data: user } = (await supabase
    .from("users")
    .select("privacy_accepted_at, terms_accepted_at")
    .eq("id", session.user.id)
    .single()) as {
    data: { privacy_accepted_at: string | null; terms_accepted_at: string | null } | null;
  };

  if (user?.privacy_accepted_at && user?.terms_accepted_at) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">
        {dictionary.auth.consentTitle}
      </h1>
      <p className="text-sm text-slate-600">
        {dictionary.auth.consentSubtitle}
      </p>
      <ConsentForm />
    </div>
  );
}
