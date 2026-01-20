"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/LocaleProvider";

type Step = "request" | "verify" | "done";

export default function ResetPasswordPage() {
  const { dictionary } = useI18n();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const response = await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!response.ok) {
      setError(dictionary.reset.errorGeneric);
      return;
    }

    setStep("verify");
    setMessage(dictionary.reset.sent);
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const response = await fetch("/api/auth/password-reset/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword: password }),
    });

    setLoading(false);

    if (!response.ok) {
      setError(dictionary.reset.errorInvalid);
      return;
    }

    setStep("done");
    setMessage(dictionary.reset.success);
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-200/70">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {dictionary.reset.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {dictionary.reset.subtitle}
        </p>
      </div>

      {step === "done" ? (
        <div className="space-y-4">
          <p className="text-sm text-teal-700">{dictionary.reset.success}</p>
          <Link
            href="/login"
            className="block rounded-full bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
          >
            {dictionary.reset.backToLogin}
          </Link>
        </div>
      ) : null}

      {step === "request" ? (
        <form onSubmit={handleRequest} className="space-y-4" noValidate>
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
          {message ? (
            <p className="text-sm text-teal-700">{message}</p>
          ) : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
            disabled={loading}
          >
            {loading ? dictionary.reset.sending : dictionary.reset.sendButton}
          </button>
        </form>
      ) : null}

      {step === "verify" ? (
        <form onSubmit={handleVerify} className="space-y-4" noValidate>
          <div>
            <label className="text-sm font-semibold text-slate-700">
              {dictionary.auth.email}
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">
              {dictionary.reset.codeLabel}
            </label>
            <input
              type="text"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/[^0-9]/g, ""))
              }
              maxLength={6}
              inputMode="numeric"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">
              {dictionary.reset.newPasswordLabel}
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
              required
              aria-describedby="reset-password-requirement"
            />
            <p
              id="reset-password-requirement"
              className="mt-1 text-xs text-slate-500"
            >
              {dictionary.auth.passwordRequirement}
            </p>
          </div>
          {message ? (
            <p className="text-sm text-teal-700">{message}</p>
          ) : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
            disabled={loading}
          >
            {loading ? dictionary.reset.verifying : dictionary.reset.verifyButton}
          </button>
        </form>
      ) : null}

      <div className="text-sm text-slate-600">
        <Link href="/login" className="font-semibold text-slate-800 underline">
          {dictionary.reset.backToLogin}
        </Link>
      </div>
    </div>
  );
}
