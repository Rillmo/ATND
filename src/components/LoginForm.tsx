"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useI18n } from "@/components/LocaleProvider";

export default function LoginForm() {
  const { dictionary } = useI18n();
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
      setError(dictionary.auth.invalidCredentials);
      setLoading(false);
      return;
    }

    window.location.href = result?.url ?? "/dashboard";
  };

  return (
    <div className="rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-200/70">
      <h1 className="text-2xl font-semibold text-slate-900">
        {dictionary.auth.loginTitle}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {dictionary.auth.loginSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {dictionary.auth.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {dictionary.auth.password}
          </label>
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
          {loading ? dictionary.auth.loggingIn : dictionary.auth.loginButton}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        {dictionary.auth.divider}
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        className="w-full rounded-full border border-slate-300 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400"
        onClick={() => signIn("google", { callbackUrl: "/consent" })}
      >
        {dictionary.auth.googleLogin}
      </button>
    </div>
  );
}
