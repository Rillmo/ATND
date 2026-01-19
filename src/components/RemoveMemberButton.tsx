"use client";

import { useState } from "react";
import { useI18n } from "@/components/LocaleProvider";

export default function RemoveMemberButton({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  const { dictionary } = useI18n();
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
      {dictionary.org.kick}
    </button>
  );
}
