"use client";

import { useState } from "react";
import LocationPicker from "@/components/LocationPicker";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";
import { useI18n } from "@/components/LocaleProvider";

export default function EventCreateForm({ orgId }: { orgId: string }) {
  const { dictionary, locale } = useI18n();
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [radius, setRadius] = useState(100);
  const [location, setLocation] = useState<{
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!location) {
      setError(dictionary.event.locationEmpty);
      setLoading(false);
      return;
    }

    const response = await fetch(`/api/orgs/${orgId}/events`, {
      method: "POST",
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

    window.location.href = `/orgs/${orgId}`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl bg-white/90 p-8 shadow-sm ring-1 ring-slate-200/70"
    >
      <h1 className="text-2xl font-semibold text-slate-900">
        {dictionary.event.createTitle}
      </h1>
      <div>
        <label className="text-sm font-semibold text-slate-700">
          {dictionary.event.title}
        </label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
          required
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
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
            required
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
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
            required
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
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
            required
          />
        </div>
      </div>
      <LocationPicker
        value={location}
        radiusMeters={radius}
        onRadiusChange={setRadius}
        onChange={setLocation}
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        className="w-full rounded-full bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
        disabled={loading}
      >
        {dictionary.event.createTitle}
      </button>
    </form>
  );
}
