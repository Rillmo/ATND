"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";
import { useI18n } from "@/components/LocaleProvider";
import Link from "next/link";

export default function SignupForm() {
  const { dictionary, locale } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        termsAccepted,
        privacyAccepted,
      }),
    });

    if (!response.ok) {
      setError(getFriendlyErrorMessage(response.status, "signup", locale));
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
      setError(dictionary.auth.loginFailed);
      setLoading(false);
      return;
    }

    window.location.href = result?.url ?? "/dashboard";
  };

  return (
    <div className="rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-200/70">
      <h1 className="text-2xl font-semibold text-slate-900">
        {dictionary.auth.signupTitle}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {dictionary.auth.signupSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {dictionary.auth.name}
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
            required
          />
        </div>
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
            minLength={8}
            required
          />
        </div>
        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-1"
            required
          />
          <span>
            {dictionary.auth.termsAgree}{" "}
            <Link href="/terms" className="underline">
              {dictionary.auth.termsLabel}
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(event) => setPrivacyAccepted(event.target.checked)}
            className="mt-1"
            required
          />
          <span>
            {dictionary.auth.privacyAgree}{" "}
            <Link href="/privacy" className="underline">
              {dictionary.auth.privacyLabel}
            </Link>
            .
          </span>
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-full bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
          disabled={loading}
        >
          {loading ? dictionary.auth.signingUp : dictionary.auth.signupButton}
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
