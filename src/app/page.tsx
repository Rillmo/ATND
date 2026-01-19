import Link from "next/link";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookie } from "@/lib/i18n-server";
import { getAuthSession } from "@/auth";

export default async function Home() {
  const locale = await getLocaleFromCookie();
  const dictionary = getDictionary(locale);
  const session = await getAuthSession();
  const isLoggedIn = Boolean(session?.user?.id);
  if (session?.user?.needsConsent) {
    redirect("/consent");
  }

  return (
    <div className="space-y-16">
      <section className="grid gap-10 rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-200/70 md:grid-cols-[1.1fr_0.9fr] md:p-10">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
            {dictionary.home.eyebrow}
          </p>
          <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
            {dictionary.home.title}
          </h1>
          <p className="text-lg text-slate-600">
            {dictionary.home.description}
          </p>
          {!isLoggedIn ? (
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="w-full rounded-full bg-teal-600 px-6 py-3 text-center text-sm font-semibold text-white shadow hover:bg-teal-700 sm:w-auto"
              >
                {dictionary.home.ctaStart}
              </Link>
              <Link
                href="/login"
                className="w-full rounded-full border border-slate-300 px-6 py-3 text-center text-sm font-semibold text-slate-700 hover:border-slate-400 sm:w-auto"
              >
                {dictionary.home.ctaLogin}
              </Link>
            </div>
          ) : null}
        </div>
        <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
          <div className="space-y-6">
            <div className="text-sm uppercase tracking-[0.2em] text-teal-200">
              {dictionary.home.todayTitle}
            </div>
            <div className="rounded-xl bg-slate-800/70 p-4">
              <p className="text-lg font-semibold">
                {dictionary.home.cardOneTitle}
              </p>
              <p className="text-sm text-slate-300">
                {dictionary.home.cardOneTime}
              </p>
              <p className="mt-2 text-xs text-teal-200">
                {dictionary.home.cardOneStatus}
              </p>
            </div>
            <div className="rounded-xl bg-slate-800/60 p-4">
              <p className="text-lg font-semibold">
                {dictionary.home.cardTwoTitle}
              </p>
              <p className="text-sm text-slate-300">
                {dictionary.home.cardTwoTime}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {dictionary.home.cardTwoStatus}
              </p>
            </div>
            <div className="rounded-xl border border-dashed border-slate-600 p-4 text-sm text-slate-300">
              {dictionary.home.cardNote}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: dictionary.home.featureOneTitle,
            desc: dictionary.home.featureOneDesc,
          },
          {
            title: dictionary.home.featureTwoTitle,
            desc: dictionary.home.featureTwoDesc,
          },
          {
            title: dictionary.home.featureThreeTitle,
            desc: dictionary.home.featureThreeDesc,
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70"
          >
            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
