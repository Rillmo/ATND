"use client";

import { useState } from "react";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";
import { useI18n } from "@/components/LocaleProvider";

export default function CheckInButton({
  orgId,
  eventId,
}: {
  orgId: string;
  eventId: string;
}) {
  const { dictionary, locale } = useI18n();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
          setMessage(
            getFriendlyErrorMessage(response.status, "checkin", locale)
          );
        } else {
          setMessage(dictionary.event.checkinSuccess);
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
        disabled={loading}
        className="rounded-full bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
      >
        {loading ? dictionary.event.checkingIn : dictionary.event.checkIn}
      </button>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
