import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import SupportForm from "@/components/SupportForm";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookie } from "@/lib/i18n-server";

export default async function SupportPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const locale = await getLocaleFromCookie();
  const dictionary = getDictionary(locale);

  return (
    <div className="mx-auto max-w-2xl rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-200/70">
      <h1 className="text-2xl font-semibold text-slate-900">
        {dictionary.support.title}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {dictionary.support.subtitle}
      </p>
      <div className="mt-6">
        <SupportForm />
      </div>
    </div>
  );
}
