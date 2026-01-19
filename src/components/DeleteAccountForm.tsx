"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useI18n } from "@/components/LocaleProvider";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";

export default function DeleteAccountForm() {
  const { dictionary, locale } = useI18n();
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const expected = dictionary.settings.deleteInputPlaceholder;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (confirmText.trim() !== expected) {
      setError(dictionary.settings.deleteMismatch);
      return;
    }

    setLoading(true);
    const response = await fetch("/api/account", { method: "DELETE" });

    if (!response.ok) {
      setError(getFriendlyErrorMessage(response.status, "accountDelete", locale));
      setLoading(false);
      return;
    }

    await signOut({ callbackUrl: "/" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-slate-700">
          {dictionary.settings.deleteInputLabel}
        </label>
        <input
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
          placeholder={dictionary.settings.deleteInputPlaceholder}
        />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        className="w-full rounded-full bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70"
        disabled={loading}
      >
        {loading ? dictionary.settings.deleting : dictionary.settings.deleteButton}
      </button>
    </form>
  );
}
