"use client";

import { useEffect, useRef, useState } from "react";

const MAPS_SCRIPT_ID = "google-maps-script";

type LocationValue = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type LocationPickerProps = {
  value: LocationValue | null;
  radiusMeters: number;
  onRadiusChange: (value: number) => void;
  onChange: (value: LocationValue | null) => void;
};

function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window not available"));
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  const existing = document.getElementById(
    MAPS_SCRIPT_ID
  ) as HTMLScriptElement | null;
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

export default function LocationPicker({
  value,
  radiusMeters,
  onRadiusChange,
  onChange,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const safeRadius =
    Number.isFinite(radiusMeters) && radiusMeters > 0 ? radiusMeters : 100;
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const updateLocation = (nextValue: LocationValue) => {
    setMessage(null);
    onChange(nextValue);

    if (mapInstanceRef.current && markerRef.current) {
      const position = new google.maps.LatLng(
        nextValue.latitude,
        nextValue.longitude
      );
      mapInstanceRef.current.panTo(position);
      mapInstanceRef.current.setZoom(15);
      markerRef.current.setPosition(position);
      circleRef.current?.setCenter(position);
    }
  };

  const reverseGeocode = (lat: number, lng: number) => {
    return new Promise<{
      address: string;
      name: string;
    }>((resolve, reject) => {
      if (!window.google?.maps) {
        reject(new Error("Maps not ready"));
        return;
      }
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status !== "OK" || !results?.[0]) {
          reject(new Error("Geocode failed"));
          return;
        }
        const top = results[0];
        resolve({
          address: top.formatted_address,
          name: top.address_components?.[0]?.long_name ?? "현재 위치",
        });
      });
    });
  };

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      setMessage("브라우저가 위치 정보를 지원하지 않습니다.");
      return;
    }

    setLocating(true);
    setMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const geo = await reverseGeocode(lat, lng);
          updateLocation({
            name: geo.name || "현재 위치",
            address: geo.address || "",
            latitude: lat,
            longitude: lng,
          });
        } catch {
          updateLocation({
            name: "현재 위치",
            address: "",
            latitude: lat,
            longitude: lng,
          });
          setMessage("주소를 가져오지 못했습니다. 좌표만 설정되었습니다.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setMessage("위치 정보를 가져오지 못했습니다.");
      }
    );
  };

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setStatus("error");
      setMessage("Google Maps API 키가 설정되지 않았습니다.");
      return;
    }

    let cancelled = false;

    setStatus("loading");
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled) return;
        setStatus("ready");

        if (!mapRef.current) return;

        const defaultCenter = new google.maps.LatLng(37.5665, 126.978);
        const map = new google.maps.Map(mapRef.current, {
          center: value
            ? new google.maps.LatLng(value.latitude, value.longitude)
            : defaultCenter,
          zoom: value ? 15 : 12,
          mapTypeControl: false,
          streetViewControl: false,
        });

        mapInstanceRef.current = map;

        const marker = new google.maps.Marker({
          map,
          position: value
            ? new google.maps.LatLng(value.latitude, value.longitude)
            : defaultCenter,
        });

        markerRef.current = marker;

        const circle = new google.maps.Circle({
          map,
          center: value
            ? new google.maps.LatLng(value.latitude, value.longitude)
            : defaultCenter,
          radius: safeRadius,
          fillColor: "#14b8a6",
          fillOpacity: 0.18,
          strokeColor: "#0f766e",
          strokeOpacity: 0.6,
          strokeWeight: 2,
          editable: true,
        });

        circle.addListener("radius_changed", () => {
          const nextRadius = Math.round(circle.getRadius());
          if (!Number.isNaN(nextRadius) && nextRadius > 0) {
            onRadiusChange(nextRadius);
          }
        });

        circleRef.current = circle;

        if (inputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(
            inputRef.current,
            {
              fields: ["name", "formatted_address", "geometry"],
              types: ["establishment", "geocode"],
            }
          );

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry?.location) {
              setMessage("선택한 장소의 위치 정보를 가져오지 못했습니다.");
              return;
            }

            updateLocation({
              name: place.name ?? "",
              address: place.formatted_address ?? "",
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            });
          });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        setMessage("Google Maps 로딩에 실패했습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [onChange, value]);

  useEffect(() => {
    if (!value || !mapInstanceRef.current || !markerRef.current) {
      return;
    }

    const position = new google.maps.LatLng(value.latitude, value.longitude);
    mapInstanceRef.current.panTo(position);
    markerRef.current.setPosition(position);
    circleRef.current?.setCenter(position);
  }, [value]);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(safeRadius);
  }, [safeRadius]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="text-sm font-semibold text-slate-700">
            장소 검색 (Google Maps)
          </label>
          <input
            ref={inputRef}
            placeholder="장소 또는 주소를 입력하세요"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="h-10 rounded-full border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-70"
          disabled={locating}
        >
          {locating ? "내 위치 찾는 중..." : "내 위치로 설정"}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-rose-600">{message}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="h-64 w-full" ref={mapRef} />
      </div>

      <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200/70">
        <label className="text-sm font-semibold text-slate-700">
          출석 반경 (m)
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="range"
            min={10}
            max={1000}
            step={10}
            value={safeRadius}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              if (Number.isFinite(nextValue) && nextValue > 0) {
                onRadiusChange(nextValue);
              }
            }}
            className="w-full md:flex-1"
          />
          <input
            type="number"
            min={1}
            value={safeRadius}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              if (Number.isFinite(nextValue) && nextValue > 0) {
                onRadiusChange(nextValue);
              }
            }}
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          지도 위 원형 오버레이를 직접 드래그해 반경을 조절할 수도 있습니다.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">선택된 장소</p>
          <p className="mt-1 text-sm text-slate-700">
            {value?.name || "아직 선택되지 않았습니다."}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {value?.address || ""}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">좌표</p>
          <p className="mt-1 text-sm text-slate-700">
            {value
              ? `${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}`
              : "-"}
          </p>
        </div>
      </div>

      {status === "loading" ? (
        <p className="text-xs text-slate-500">지도 로딩 중...</p>
      ) : null}
      {status === "error" ? (
        <p className="text-xs text-rose-600">
          지도 로딩 실패. API 키와 권한을 확인해주세요.
        </p>
      ) : null}
    </div>
  );
}
