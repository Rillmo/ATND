"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/LocaleProvider";

type EventRow = {
  id: string;
  title: string;
  event_date: string;
  attendance_start_at: string;
  attendance_end_at: string;
  location_name: string | null;
  status: "UPCOMING" | "ONGOING" | "ENDED";
};

export default function EventList({
  orgId,
  events,
  isManager,
}: {
  orgId: string;
  events: EventRow[];
  isManager: boolean;
}) {
  const { dictionary } = useI18n();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const upcomingEvents = useMemo(
    () => events.filter((event) => event.status === "UPCOMING"),
    [events]
  );
  const ongoingEvents = useMemo(
    () => events.filter((event) => event.status === "ONGOING"),
    [events]
  );
  const endedEvents = useMemo(
    () => events.filter((event) => event.status === "ENDED"),
    [events]
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (prev.size === upcomingEvents.length) return new Set();
      return new Set(upcomingEvents.map((event) => event.id));
    });
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    const confirmed = window.confirm(dictionary.event.bulkDeleteConfirm);
    if (!confirmed) return;
    setBulkLoading(true);
    setBulkError(null);
    const response = await fetch(`/api/orgs/${orgId}/events/bulk-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });

    if (!response.ok) {
      setBulkError(dictionary.event.bulkDeleteError);
      setBulkLoading(false);
      return;
    }

    window.location.reload();
  };

  const renderList = (list: EventRow[], label: string, badgeClasses: string) => (
    <div className="space-y-3">
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${badgeClasses}`}>
        {label}
      </p>
      {list.map((event) => {
        const content = (
          <div className="flex flex-1 items-center justify-between rounded-2xl bg-white/90 px-5 py-4 shadow-sm ring-1 ring-slate-200/70">
            <div>
              <p className="text-sm font-semibold text-slate-900">{event.title}</p>
              <p className="text-xs text-slate-500">
                {event.event_date} · {event.location_name ?? dictionary.event.locationUnset}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {label}
            </span>
          </div>
        );

        if (event.status === "UPCOMING" && isManager) {
          const checked = selected.has(event.id);
          return (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-2xl bg-white/90 px-3 py-2 shadow-sm ring-1 ring-slate-200/70"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-slate-900"
                checked={checked}
                onChange={() => toggleSelect(event.id)}
              />
              <Link href={`/orgs/${orgId}/events/${event.id}`} className="flex-1">
                {content}
              </Link>
            </div>
          );
        }

        return (
          <Link
            key={event.id}
            href={`/orgs/${orgId}/events/${event.id}`}
            className="flex items-center justify-between rounded-2xl bg-white/90 px-5 py-4 shadow-sm ring-1 ring-slate-200/70"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{event.title}</p>
              <p className="text-xs text-slate-500">
                {event.event_date} · {event.location_name ?? dictionary.event.locationUnset}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {isManager && upcomingEvents.length ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-slate-900"
              checked={selected.size === upcomingEvents.length}
              onChange={toggleSelectAll}
            />
            <span className="font-semibold">
              {dictionary.event.bulkSelectionLabel.replace(
                "{count}",
                String(selected.size)
              )}
            </span>
          </div>
          <button
            type="button"
            disabled={selected.size === 0 || bulkLoading}
            onClick={handleBulkDelete}
            className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
          >
            {dictionary.event.bulkDelete}
          </button>
          {bulkError ? <span className="text-rose-600">{bulkError}</span> : null}
        </div>
      ) : null}

      {ongoingEvents.length
        ? renderList(
            ongoingEvents,
            dictionary.org.sectionOngoing,
            "text-teal-700"
          )
        : null}
      {upcomingEvents.length
        ? renderList(upcomingEvents, dictionary.org.sectionUpcoming, "text-slate-500")
        : null}
      {endedEvents.length
        ? renderList(endedEvents, dictionary.org.sectionEnded, "text-slate-500")
        : null}
    </div>
  );
}
