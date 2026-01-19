"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      setError(getFriendlyErrorMessage(response.status, "signup"));
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      setError("로그인에 실패했습니다. 로그인 화면에서 다시 시도하세요.");
      setLoading(false);
      return;
    }

    window.location.href = result?.url ?? "/dashboard";
  };

  return (
    <div className="rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-200/70">
      <h1 className="text-2xl font-semibold text-slate-900">회원가입</h1>
      <p className="mt-2 text-sm text-slate-500">
        이메일 가입 후 바로 조직을 만들거나 초대 코드를 입력하세요.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">이름</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
            required
          />
        </div>
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
            minLength={8}
            required
          />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-full bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
          disabled={loading}
        >
          {loading ? "가입 중..." : "이메일로 가입"}
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
        Google로 회원가입
      </button>
    </div>
  );
}
