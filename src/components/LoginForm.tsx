"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
      return;
    }

    window.location.href = result?.url ?? "/dashboard";
  };

  return (
    <div className="rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-200/70">
      <h1 className="text-2xl font-semibold text-slate-900">로그인</h1>
      <p className="mt-2 text-sm text-slate-500">
        이메일 또는 Google 계정으로 접속합니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
            required
          />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
          disabled={loading}
        >
          {loading ? "로그인 중..." : "이메일로 로그인"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        또는
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        className="w-full rounded-full border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        Google로 로그인
      </button>
    </div>
  );
}
