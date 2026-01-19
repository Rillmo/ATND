"use client";

import { useState } from "react";
import { useI18n } from "@/components/LocaleProvider";

export default function EventDeleteButton({
  orgId,
  eventId,
}: {
  orgId: string;
  eventId: string;
}) {
  const { dictionary } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/orgs/${orgId}/events/${eventId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError(dictionary.errors.eventCreate.default);
      setLoading(false);
      return;
    }

    window.location.href = `/orgs/${orgId}`;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-300"
      >
        {dictionary.event.deleteTitle}
      </button>

      {open ? (
        <div className="absolute right-0 top-10 z-10 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <p className="text-sm font-semibold text-slate-900">
            {dictionary.event.deleteConfirm}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {dictionary.event.deleteNotice}
          </p>
          {error ? (
            <p className="mt-2 text-xs text-rose-600">{error}</p>
          ) : null}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              onClick={() => setOpen(false)}
            >
              {dictionary.event.deleteCancel}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-70"
            >
              {dictionary.event.deleteAction}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
