"use client";

import { useMemo, useState } from "react";
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
  const [recurring, setRecurring] = useState(false);
  const [weeksCount, setWeeksCount] = useState(6);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAllPreview, setShowAllPreview] = useState(false);

  const previewDates = useMemo(() => {
    if (!recurring || !eventDate || !startAt) return [];
    const baseDateParts = eventDate.split("-").map(Number);
    if (baseDateParts.length !== 3) return [];
    const [year, month, day] = baseDateParts;
    const baseDate = new Date(year, month - 1, day);
    const startBase = new Date(startAt);
    if (Number.isNaN(startBase.valueOf())) return [];
    const baseDay = ((baseDate.getDay() + 6) % 7) + 1;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - (baseDay - 1));
    const dates: string[] = [];
    const now = new Date();
    for (let week = 0; week < weeksCount; week += 1) {
      weekdays.forEach((weekday) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + (weekday - 1) + week * 7);
        const startCandidate = new Date(date);
        startCandidate.setHours(startBase.getHours(), startBase.getMinutes(), 0, 0);
        if (startCandidate < startBase) return;
        if (startCandidate < now) return;
        dates.push(
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(date.getDate()).padStart(2, "0")}`
        );
      });
    }
    dates.sort();
    return dates;
  }, [eventDate, recurring, startAt, weeksCount, weekdays]);

  const parseDateParts = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return { y, m, d, date: new Date(Date.UTC(y, m - 1, d)) };
  };

  const groupedByMonth = useMemo(() => {
    const byMonth = new Map<
      string,
      { month: string; dates: { iso: string; day: number }[] }
    >();
    previewDates.forEach((iso) => {
      const { y, m, d, date } = parseDateParts(iso);
      const key = `${y}-${String(m).padStart(2, "0")}`;
      const label = date.toLocaleDateString(
        locale === "ko" ? "ko-KR" : "en-US",
        { month: "long", year: "numeric" }
      );
      const entry = byMonth.get(key) ?? { month: label, dates: [] };
      entry.dates.push({ iso, day: d });
      byMonth.set(key, entry);
    });
    return Array.from(byMonth.values());
  }, [locale, previewDates]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!location) {
      setError(dictionary.event.locationEmpty);
      setLoading(false);
      return;
    }

    if (recurring && weekdays.length === 0) {
      setError(dictionary.event.repeatWeekdays);
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
        recurrence: recurring
          ? {
              weeks: weeksCount,
              weekdays,
            }
          : undefined,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const reason = data?.error as string | undefined;
      const reasonMap: Record<string, string> = {
        "Invalid input": dictionary.event.errorInvalidInput,
        "Invalid recurrence": dictionary.event.errorInvalidRecurrence,
        "Invalid date": dictionary.event.errorInvalidDate,
        "Invalid time": dictionary.event.errorInvalidTime,
        "Start time must be in the future":
          dictionary.event.errorStartInFuture,
        "End time must be after start": dictionary.event.errorEndAfterStart,
        "No events generated": dictionary.event.errorNoEvents,
        "Failed to create events": dictionary.event.errorCreateFailed,
        "Failed to create event": dictionary.event.errorCreateFailed,
      };
      setError(
        (reason ? reasonMap[reason] : undefined) ??
          getFriendlyErrorMessage(response.status, "eventCreate", locale)
      );
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

      <div className="rounded-2xl bg-slate-50 px-4 py-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">
            {dictionary.event.repeatLabel}
          </label>
          <button
            type="button"
            onClick={() => setRecurring((prev) => !prev)}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600"
          >
            {recurring ? "ON" : "OFF"}
          </button>
        </div>
        {recurring ? (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">
                {dictionary.event.repeatWeekdays}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { label: dictionary.event.weekdayMon, value: 1 },
                  { label: dictionary.event.weekdayTue, value: 2 },
                  { label: dictionary.event.weekdayWed, value: 3 },
                  { label: dictionary.event.weekdayThu, value: 4 },
                  { label: dictionary.event.weekdayFri, value: 5 },
                  { label: dictionary.event.weekdaySat, value: 6 },
                  { label: dictionary.event.weekdaySun, value: 7 },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setWeekdays((prev) =>
                        prev.includes(item.value)
                          ? prev.filter((day) => day !== item.value)
                          : [...prev, item.value]
                      )
                    }
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      weekdays.includes(item.value)
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 ring-1 ring-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">
                {dictionary.event.repeatWeeks}
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={weeksCount}
                onChange={(event) => setWeeksCount(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
              />
            </div>
            <div className="rounded-xl bg-white px-4 py-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">
                {dictionary.event.repeatPreview}
              </p>
              {previewDates.length === 0 ? (
                <p className="mt-1">-</p>
              ) : (
                <>
                  <p className="mt-1 text-slate-700 font-semibold">
                    {previewDates.length}{" "}
                    {locale === "ko" ? "개 일정 예정" : "occurrences scheduled"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {locale === "ko" ? "첫 일정" : "First"}:{" "}
                    {parseDateParts(previewDates[0]).date.toLocaleDateString(
                      locale === "ko" ? "ko-KR" : "en-US",
                      { weekday: "short", month: "short", day: "numeric", year: "numeric" }
                    )}
                    {" · "}
                    {locale === "ko" ? "마지막" : "Last"}:{" "}
                    {parseDateParts(previewDates[previewDates.length - 1]).date.toLocaleDateString(
                      locale === "ko" ? "ko-KR" : "en-US",
                      { weekday: "short", month: "short", day: "numeric", year: "numeric" }
                    )}
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {(showAllPreview ? groupedByMonth : groupedByMonth.slice(0, 1)).map(
                      (group) => (
                        <div key={group.month} className="rounded-lg border border-slate-200 p-3">
                          <p className="text-[12px] font-semibold text-slate-700">
                            {group.month}
                          </p>
                          <div className="mt-2 grid grid-cols-7 gap-1 text-[11px] text-slate-500">
                            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                              <span key={d} className="text-center">
                                {d}
                              </span>
                            ))}
                            {(() => {
                              const dates = group.dates.map((d) => d.day);
                              const sampleParts = parseDateParts(group.dates[0].iso);
                              const firstOfMonth = new Date(
                                Date.UTC(sampleParts.y, sampleParts.m - 1, 1)
                              );
                              const startOffset = (firstOfMonth.getUTCDay() + 6) % 7; /* Monday=0 */
                              const totalDays = new Date(
                                Date.UTC(sampleParts.y, sampleParts.m, 0)
                              ).getUTCDate();
                              const cells: Array<{ key: string; label?: number }> = [];
                              for (let i = 0; i < startOffset; i += 1) {
                                cells.push({ key: `pad-${i}` });
                              }
                              for (let day = 1; day <= totalDays; day += 1) {
                                cells.push({ key: `day-${day}`, label: day });
                              }
                              return cells.map((cell) => (
                                <span
                                  key={cell.key}
                                  className={`flex h-7 w-7 items-center justify-center rounded-md ${
                                    cell.label && dates.includes(cell.label)
                                      ? "bg-slate-900 text-white"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {cell.label ?? ""}
                                </span>
                              ));
                            })()}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                  {groupedByMonth.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setShowAllPreview((prev) => !prev)}
                      className="mt-3 text-[11px] font-semibold text-slate-700 underline"
                    >
                      {showAllPreview
                        ? locale === "ko"
                          ? "접기"
                          : "Show less"
                        : locale === "ko"
                          ? "더보기"
                          : "Show more"}
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ) : null}
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
