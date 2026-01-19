import Link from "next/link";
import { getAuthSession } from "@/auth";
import SignOutButton from "@/components/SignOutButton";

export default async function NavBar() {
  const session = await getAuthSession();

  return (
    <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-slate-900">
          ATND
        </Link>
        <nav className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                대시보드
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
