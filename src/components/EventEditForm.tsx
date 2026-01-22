"use client";

import { useState } from "react";
import LocationPicker from "@/components/LocationPicker";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";
import { useI18n } from "@/components/LocaleProvider";

export default function EventEditForm({
  orgId,
  eventId,
  initialEvent,
}: {
  orgId: string;
  eventId: string;
  initialEvent: {
    title: string;
    event_date: string;
    attendance_start_at: string;
    attendance_end_at: string;
    radius_meters: number;
    location_name: string | null;
    location_address: string | null;
    latitude: number;
    longitude: number;
  };
}) {
  const { dictionary, locale } = useI18n();
  const [title, setTitle] = useState(initialEvent.title);
  const [eventDate, setEventDate] = useState(initialEvent.event_date);
  const [startAt, setStartAt] = useState(initialEvent.attendance_start_at.slice(0, 16));
  const [endAt, setEndAt] = useState(initialEvent.attendance_end_at.slice(0, 16));
  const [radius, setRadius] = useState(initialEvent.radius_meters);
  const [location, setLocation] = useState<{
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  } | null>({
    name: initialEvent.location_name ?? "",
    address: initialEvent.location_address ?? "",
    latitude: initialEvent.latitude,
    longitude: initialEvent.longitude,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const startDate = new Date(initialEvent.attendance_start_at);
  const endDate = new Date(initialEvent.attendance_end_at);
  const hasStarted = now >= startDate;
  const hasEnded = now >= endDate;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!location) {
      setError(dictionary.event.locationEmpty);
      setLoading(false);
      return;
    }

    const response = await fetch(`/api/orgs/${orgId}/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        eventDate,
        attendanceStartAt: new Date(startAt).toISOString(),
        attendanceEndAt: new Date(endAt).toISOString(),
        radiusMeters: Number(radius),
        locationName: location.name || null,
        locationAddress: location.address || null,
        latitude: location.latitude,
        longitude: location.longitude,
      }),
    });

    if (!response.ok) {
      setError(getFriendlyErrorMessage(response.status, "eventCreate", locale));
      setLoading(false);
      return;
    }

    window.location.href = `/orgs/${orgId}/events/${eventId}`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8"
    >
      <div>
        <label className="text-sm font-semibold text-slate-700">
          {dictionary.event.title}
        </label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          required
          disabled={hasEnded}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {dictionary.event.date}
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            required
            disabled={hasStarted || hasEnded}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {dictionary.event.start}
          </label>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            required
            disabled={hasStarted || hasEnded}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {dictionary.event.end}
          </label>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            required
            disabled={hasEnded}
          />
          {hasStarted && !hasEnded ? (
            <p className="mt-1 text-xs text-slate-500">
              {dictionary.event.editLimitedNote}
            </p>
          ) : null}
        </div>
      </div>

      {hasStarted ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-semibold text-slate-700">
            {dictionary.event.location}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {location?.name || dictionary.event.locationUnset}
          </p>
          {location?.address ? (
            <p className="mt-1 text-xs text-slate-500">{location.address}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">
            {dictionary.event.radius}: {radius}m
          </p>
        </div>
      ) : (
        <LocationPicker
          value={location}
          radiusMeters={radius}
          onRadiusChange={setRadius}
          onChange={setLocation}
        />
      )}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {hasEnded ? (
        <p className="text-sm text-rose-600">
          {dictionary.event.editClosedNote}
        </p>
      ) : null}
      <button
        type="submit"
        className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
        disabled={loading || hasEnded}
      >
        {dictionary.event.editTitle}
      </button>
    </form>
  );
}
