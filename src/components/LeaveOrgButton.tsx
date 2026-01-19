"use client";

import { useState } from "react";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";

export default function LeaveOrgButton({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeave = async () => {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/orgs/${orgId}/leave`, {
      method: "POST",
    });

    if (!response.ok) {
      setError(getFriendlyErrorMessage(response.status, "leaveOrg"));
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div>
      <button
        className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:border-rose-300"
        onClick={handleLeave}
        disabled={loading}
      >
        조직 탈퇴
      </button>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
