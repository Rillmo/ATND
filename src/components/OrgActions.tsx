"use client";

import { useState } from "react";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";

export default function OrgActions() {
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
      setError(getFriendlyErrorMessage(response.status, "orgCreate"));
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
      setError(getFriendlyErrorMessage(response.status, "orgJoin"));
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
        <h2 className="text-lg font-semibold text-slate-900">새 조직 만들기</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-700">조직 이름</label>
            <input
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">조직 설명</label>
            <input
              value={createDescription}
              onChange={(event) => setCreateDescription(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
              placeholder="선택"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
            disabled={loading}
          >
            조직 생성
          </button>
        </div>
      </form>

      <form
        onSubmit={handleJoin}
        className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70"
      >
        <h2 className="text-lg font-semibold text-slate-900">초대 코드로 가입</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-700">초대 코드</label>
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
            조직 가입
          </button>
        </div>
      </form>
      {error ? (
        <p className="text-sm text-rose-600 lg:col-span-2">{error}</p>
      ) : null}
    </div>
  );
}
