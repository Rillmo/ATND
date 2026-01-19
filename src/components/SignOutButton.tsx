"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      로그아웃
    </button>
  );
}
