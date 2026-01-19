"use client";

import { useState } from "react";
import { useI18n } from "@/components/LocaleProvider";

type Member = {
  user: { id: string; name: string | null; email: string | null } | null;
  role: string;
};

export default function TransferManagerForm({
  orgId,
  members,
}: {
  orgId: string;
  members: Member[];
}) {
  const { dictionary } = useI18n();
  const candidates = members.filter((member) => member.role !== "MANAGER");
  const [selected, setSelected] = useState(
    candidates[0]?.user?.id ?? ""
  );
  const [loading, setLoading] = useState(false);

  if (candidates.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        {dictionary.org.transferEmpty}
      </p>
    );
  }

  const handleTransfer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    setLoading(true);

    await fetch(`/api/orgs/${orgId}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newManagerUserId: selected }),
    });

    window.location.reload();
  };

  return (
    <form onSubmit={handleTransfer} className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-slate-600">
        {dictionary.org.transferTitle}
      </label>
      <select
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
      >
        {candidates.map((member) => (
          <option key={member.user?.id} value={member.user?.id}>
            {member.user?.name ??
              member.user?.email ??
              dictionary.dashboard.roleMember}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
        disabled={loading}
      >
        {dictionary.org.transferButton}
      </button>
    </form>
  );
}
