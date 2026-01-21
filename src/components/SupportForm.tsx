"use client";

import { useState } from "react";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";
import { useI18n } from "@/components/LocaleProvider";

export default function SupportForm() {
  const { dictionary, locale } = useI18n();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (
      trimmedSubject.length < 2 ||
      trimmedSubject.length > 120 ||
      trimmedMessage.length < 2 ||
      trimmedMessage.length > 2000
    ) {
      setError(dictionary.support.errorInvalid);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    let response: Response | null = null;

    try {
      response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: trimmedSubject,
          message: trimmedMessage,
        }),
        signal: controller.signal,
      });
    } catch {
      setError(dictionary.support.errorGeneric);
      setLoading(false);
      clearTimeout(timeoutId);
      return;
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      setError(getFriendlyErrorMessage(response.status, "support", locale));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setSubject("");
    setMessage("");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label className="text-sm font-semibold text-slate-700">
          {dictionary.support.subjectLabel}
        </label>
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
          maxLength={120}
          required
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700">
          {dictionary.support.messageLabel}
        </label>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-2 min-h-[140px] w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
          maxLength={2000}
          required
        />
      </div>
      {success ? (
        <p className="text-sm text-emerald-600">
          {dictionary.support.success}
        </p>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
        disabled={loading}
      >
        {loading ? dictionary.support.sending : dictionary.support.submit}
      </button>
    </form>
  );
}
