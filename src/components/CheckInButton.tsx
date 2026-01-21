"use client";

import { useEffect, useState } from "react";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";
import { useI18n } from "@/components/LocaleProvider";

export default function CheckInButton({
  orgId,
  eventId,
  checkedIn,
  canCheckIn,
}: {
  orgId: string;
  eventId: string;
  checkedIn: boolean;
  canCheckIn: boolean;
}) {
  const { dictionary, locale } = useI18n();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [checked, setChecked] = useState(checkedIn);

  useEffect(() => {
    setChecked(checkedIn);
  }, [checkedIn]);

  const handleCheckIn = () => {
    setLoading(true);
    setMessage(null);

    if (!navigator.geolocation) {
      setMessage(dictionary.event.locationNotSupported);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const response = await fetch(
          `/api/orgs/${orgId}/events/${eventId}/checkin`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          }
        );

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          if (data?.error === "TIME_WINDOW") {
            setMessage(dictionary.errors.checkin["400_TIME"]);
          } else if (data?.error === "OUT_OF_RADIUS") {
            setMessage(dictionary.errors.checkin["400_GEO"]);
          } else {
            setMessage(getFriendlyErrorMessage(response.status, "checkin", locale));
          }
        } else {
          setMessage(dictionary.event.checkinSuccess);
          setChecked(true);
        }
        setLoading(false);
      },
      () => {
        setMessage(dictionary.event.locationUnavailable);
        setLoading(false);
      }
    );
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleCheckIn}
        disabled={loading || checked || !canCheckIn}
        className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition ${
          checked || !canCheckIn
            ? "bg-slate-400"
            : "bg-teal-600 hover:bg-teal-700 disabled:opacity-70"
        }`}
      >
        {checked
          ? dictionary.event.checkinSuccess
          : loading
          ? dictionary.event.checkingIn
          : dictionary.event.checkIn}
      </button>
      {(!canCheckIn && !checked && !message) ? (
        <p className="text-xs text-slate-600">
          {dictionary.errors.checkin["400_TIME"]}
        </p>
      ) : null}
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
