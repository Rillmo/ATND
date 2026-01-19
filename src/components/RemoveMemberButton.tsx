"use client";

import { useState } from "react";

export default function RemoveMemberButton({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    setLoading(true);
    await fetch(`/api/orgs/${orgId}/members/${userId}`, { method: "DELETE" });
    window.location.reload();
  };

  return (
    <button
      onClick={handleRemove}
      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
      disabled={loading}
    >
      강퇴
    </button>
  );
}
