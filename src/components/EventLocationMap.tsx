"use client";

import { useEffect, useRef, useState } from "react";

type EventLocationMapProps = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  title: string;
  address?: string | null;
  labels: {
    mapLoading: string;
    mapError: string;
    radius: string;
  };
};

const MAPS_SCRIPT_ID = "google-maps-script";

function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window not available"));
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  const existing = document.getElementById(MAPS_SCRIPT_ID) as
    | HTMLScriptElement
    | null;
  if (existing) {
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Script failed")));
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Script failed"));
    document.head.appendChild(script);
  });
}

export default function EventLocationMap({
  latitude,
  longitude,
  radiusMeters,
  title,
  address,
  labels,
}: EventLocationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    apiKey ? "loading" : "error"
  );

  useEffect(() => {
    if (!apiKey) {
      return;
    }
    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current) return;

        const center = new google.maps.LatLng(latitude, longitude);
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
        });

        mapInstanceRef.current = map;

        markerRef.current = new google.maps.Marker({
          map,
          position: center,
          title,
        });

        circleRef.current = new google.maps.Circle({
          map,
          center,
          radius: radiusMeters,
          fillColor: "#14b8a6",
          fillOpacity: 0.18,
          strokeColor: "#0f766e",
          strokeOpacity: 0.6,
          strokeWeight: 2,
        });

        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, latitude, longitude, radiusMeters, title]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const center = new google.maps.LatLng(latitude, longitude);
    mapInstanceRef.current.panTo(center);
    markerRef.current?.setPosition(center);
    circleRef.current?.setCenter(center);
    circleRef.current?.setRadius(radiusMeters);
  }, [latitude, longitude, radiusMeters]);

  return (
    <div className="space-y-3 rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {address ? (
            <p className="mt-1 text-xs text-slate-500">{address}</p>
          ) : null}
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {labels.radius}: {radiusMeters}m
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="h-56 w-full sm:h-64" ref={mapRef} />
      </div>

      {status === "loading" ? (
        <p className="text-xs text-slate-500">{labels.mapLoading}</p>
      ) : null}
      {status === "error" ? (
        <p className="text-xs text-rose-600">{labels.mapError}</p>
      ) : null}
    </div>
  );
}
