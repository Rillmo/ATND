"use client";

import { useState } from "react";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";
import { useI18n } from "@/components/LocaleProvider";

export default function OrgActions() {
  const { dictionary, locale } = useI18n();
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createName,
        description: createDescription || null,
      }),
    });

    if (!response.ok) {
      setError(getFriendlyErrorMessage(response.status, "orgCreate", locale));
      setLoading(false);
      return;
    }

    window.location.reload();
  };

  const handleJoin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/orgs/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: joinCode }),
    });

    if (!response.ok) {
      setError(getFriendlyErrorMessage(response.status, "orgJoin", locale));
      setLoading(false);
      return;
    }

    window.location.reload();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70"
      >
        <h2 className="text-lg font-semibold text-slate-900">
          {dictionary.dashboard.createOrg}
        </h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              {dictionary.dashboard.orgName}
            </label>
            <input
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">
              {dictionary.dashboard.orgDesc}
            </label>
            <input
              value={createDescription}
              onChange={(event) => setCreateDescription(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
              placeholder={dictionary.dashboard.orgDescPlaceholder}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
            disabled={loading}
          >
            {dictionary.dashboard.createButton}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleJoin}
        className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70"
      >
        <h2 className="text-lg font-semibold text-slate-900">
          {dictionary.dashboard.joinOrg}
        </h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              {dictionary.dashboard.joinCode}
            </label>
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-70"
            disabled={loading}
          >
            {dictionary.dashboard.joinButton}
          </button>
        </div>
      </form>
      {error ? (
        <p className="text-sm text-rose-600 lg:col-span-2">{error}</p>
      ) : null}
    </div>
  );
}
