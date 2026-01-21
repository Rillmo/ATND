"use client";

import { useState } from "react";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";
import { useI18n } from "@/components/LocaleProvider";
import Link from "next/link";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S+$/;
const NAME_REGEX = /^[A-Za-z가-힣0-9]+(?:[ _-][A-Za-z가-힣0-9]+)*$/;

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

    const trimmedName = name.trim();
    if (
      trimmedName.length < 2 ||
      trimmedName.length > 50 ||
      !NAME_REGEX.test(trimmedName) ||
      /^\d+$/.test(trimmedName)
    ) {
      setLoading(false);
      setError(dictionary.auth.nameInvalid);
      return;
    }

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

    const response = await fetch("/api/auth/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
      }),
    });

    if (!response.ok) {
      setError(getFriendlyErrorMessage(response.status, "signup", locale));
      setLoading(false);
      return;
    }

    setLoading(false);
    sessionStorage.setItem(
      "pendingSignup",
      JSON.stringify({
        name: trimmedName,
        email,
        password,
        termsAccepted,
        privacyAccepted,
      })
    );
    window.location.href = `/verify?email=${encodeURIComponent(email)}`;
  };

  return (
    <div className="rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-200/70">
      <h1 className="text-2xl font-semibold text-slate-900">
        {dictionary.auth.signupTitle}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {dictionary.auth.signupSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {dictionary.auth.name}
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
            pattern="^[A-Za-z가-힣0-9]+(?:[ _-][A-Za-z가-힣0-9]+)*$"
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
            required
            aria-describedby="password-requirement"
          />
          <p
            id="password-requirement"
            className="mt-1 text-xs text-slate-500"
          >
            {dictionary.auth.passwordRequirement}
          </p>
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

    </div>
  );
}
