"use client";

import { useState } from "react";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";

export default function CheckInButton({
  orgId,
  eventId,
}: {
  orgId: string;
  eventId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCheckIn = () => {
    setLoading(true);
    setMessage(null);

    if (!navigator.geolocation) {
      setMessage("브라우저에서 위치 정보를 지원하지 않습니다.");
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
          setMessage(getFriendlyErrorMessage(response.status, "checkin"));
        } else {
          setMessage("출석 체크 완료!");
        }
        setLoading(false);
      },
      () => {
        setMessage("위치 정보를 가져오지 못했습니다.");
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
        {loading ? "위치 확인 중..." : "출석 체크"}
      </button>
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
