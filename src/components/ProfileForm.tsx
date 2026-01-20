"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/LocaleProvider";

type ProfileState = {
  name: string;
  email: string;
};

const namePattern = "^[A-Za-z가-힣0-9]+(?:[ _-]?[A-Za-z가-힣0-9]+)*$";

export default function ProfileForm() {
  const { dictionary } = useI18n();
  const [profile, setProfile] = useState<ProfileState>({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active || !data?.user) return;
        setProfile({
          name: data.user.name ?? "",
          email: data.user.email ?? "",
        });
      })
      .catch(() => null)
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);

    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profile.name.trim(),
      }),
    });

    if (!response.ok) {
      setError(dictionary.settings.saveError);
      setSaving(false);
      return;
    }

    setMessage(dictionary.settings.saveSuccess);
    setSaving(false);
  };

  if (loading) {
    return (
      <p className="text-sm text-slate-500">{dictionary.settings.saving}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-slate-700">
          {dictionary.settings.nameLabel}
        </label>
        <input
          value={profile.name}
          onChange={(event) =>
            setProfile((prev) => ({ ...prev, name: event.target.value }))
          }
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
          maxLength={50}
          pattern={namePattern}
          required
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700">
          {dictionary.settings.emailLabel}
        </label>
        <input
          value={profile.email}
          readOnly
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500"
        />
      </div>
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
        disabled={saving}
      >
        {saving ? dictionary.settings.saving : dictionary.settings.saveButton}
      </button>
    </form>
  );
}
