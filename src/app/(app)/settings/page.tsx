import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookie } from "@/lib/i18n-server";
import DeleteAccountForm from "@/components/DeleteAccountForm";

export default async function SettingsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const locale = await getLocaleFromCookie();
  const dictionary = getDictionary(locale);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          {dictionary.settings.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {dictionary.settings.subtitle}
        </p>
      </section>

      <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">
          {dictionary.settings.accountSection}
        </h2>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-800">
              {dictionary.settings.nameLabel}:
            </span>{" "}
            {session.user.name ?? "-"}
          </p>
          <p>
            <span className="font-semibold text-slate-800">
              {dictionary.settings.emailLabel}:
            </span>{" "}
            {session.user.email ?? "-"}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-rose-700">
          {dictionary.settings.deleteTitle}
        </h2>
        <p className="mt-2 text-sm text-rose-700">
          {dictionary.settings.deleteDescription}
        </p>
        <p className="mt-2 text-xs text-rose-600">
          {dictionary.settings.deleteWarning}
        </p>
        <div className="mt-6">
          <DeleteAccountForm />
        </div>
      </section>
    </div>
  );
}
