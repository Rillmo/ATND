"use client";

import { useState } from "react";
import { useI18n } from "@/components/LocaleProvider";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";

export default function OrgDeleteButton({ orgId }: { orgId: string }) {
  const { dictionary, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/orgs/${orgId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError(getFriendlyErrorMessage(response.status, "orgDelete", locale));
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:border-rose-300"
      >
        {dictionary.org.deleteTitle}
      </button>

      {open ? (
        <div className="absolute right-0 top-10 z-10 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <p className="text-sm font-semibold text-slate-900">
            {dictionary.org.deleteConfirm}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {dictionary.org.deleteNotice}
          </p>
          {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              onClick={() => setOpen(false)}
            >
              {dictionary.org.deleteCancel}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-70"
            >
              {dictionary.org.deleteAction}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
