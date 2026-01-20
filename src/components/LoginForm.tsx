"use client";

import { useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useI18n } from "@/components/LocaleProvider";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S+$/;

export default function LoginForm() {
  const { dictionary } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const resetHref = "/reset" as unknown as Route;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.includes("@")) {
      setLoading(false);
      setError(dictionary.auth.emailInvalid);
      return;
    }

    if (
      password.length < 8 ||
      password.length > 64 ||
      !PASSWORD_REGEX.test(password)
    ) {
      setLoading(false);
      setError(dictionary.auth.passwordInvalid);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
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

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
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
            aria-describedby="password-requirement"
          />
          <p
            id="password-requirement"
            className="mt-1 text-xs text-slate-500"
          >
            {dictionary.auth.passwordRequirement}
          </p>
          <div className="mt-2">
            <Link
              href={resetHref}
              className="text-xs font-semibold text-slate-700 underline"
            >
              {dictionary.auth.forgotPassword}
            </Link>
          </div>
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
