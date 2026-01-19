import Link from "next/link";
import { getAuthSession } from "@/auth";
import SignOutButton from "@/components/SignOutButton";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookie } from "@/lib/i18n-server";

export default async function NavBar() {
  const session = await getAuthSession();
  const locale = await getLocaleFromCookie();
  const dictionary = getDictionary(locale);

  return (
    <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <Link href="/" className="text-xl font-semibold text-slate-900">
          ATND
        </Link>
        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          <LocaleSwitcher
            currentLocale={locale}
            label={dictionary.nav.language}
          />
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                {dictionary.nav.dashboard}
              </Link>
              <Link
                href="/settings"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                aria-label={dictionary.nav.settings}
                title={dictionary.nav.settings}
              >
                <img
                  src="/setting.png"
                  alt=""
                  className="h-5 w-5"
                />
              </Link>
              <SignOutButton label={dictionary.nav.logout} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                {dictionary.nav.login}
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {dictionary.nav.signup}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
