"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
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
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => {
      const url = searchParams.get("callbackUrl");
      return url && url.startsWith("/") ? url : "/dashboard";
    },
    [searchParams]
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setGoogleEnabled(Boolean(data?.google));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGoogleEnabled(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
      callbackUrl,
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
            pattern="^[A-Za-z가-힣0-9]+(?:[ _-]?[A-Za-z가-힣0-9]+)*$"
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
            maxLength={64}
            pattern="^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9])\\S+$"
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

      {googleEnabled ? (
        <button
          className="flex h-10 w-full items-center justify-start gap-[10px] rounded-full border border-[#747775] bg-white px-3 text-[14px] font-medium leading-5 text-[#1F1F1F] hover:bg-[#F8F9FA] font-[var(--font-google)]"
          onClick={() => signIn("google", { callbackUrl })}
        >
          <Image
            src="/google-g-logo.png"
            alt=""
            width={18}
            height={18}
            aria-hidden="true"
          />
          {dictionary.auth.googleLogin}
        </button>
      ) : null}
    </div>
  );
}
