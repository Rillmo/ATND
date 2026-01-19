"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/LocaleProvider";

export default function ConsentForm() {
  const { dictionary } = useI18n();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!terms || !privacy) {
      setError(dictionary.auth.consentSubtitle);
      return;
    }

    setLoading(true);
    const response = await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ termsAccepted: terms, privacyAccepted: privacy }),
    });

    if (!response.ok) {
      setError(dictionary.auth.consentSubtitle);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={terms}
          onChange={(event) => setTerms(event.target.checked)}
          className="mt-1"
        />
        <span>
          {dictionary.auth.termsAgree}{" "}
          <Link href="/terms" className="underline">
            {dictionary.auth.termsLabel}
          </Link>
          .
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={privacy}
          onChange={(event) => setPrivacy(event.target.checked)}
          className="mt-1"
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
        className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
        disabled={loading}
      >
        {dictionary.auth.consentContinue}
      </button>
    </form>
  );
}
