"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

export default function LocaleSwitcher({
  currentLocale,
  label,
}: {
  currentLocale: Locale;
  label: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleChange = async (locale: Locale) => {
    if (locale === currentLocale) return;
    setLoading(true);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <div className="flex overflow-hidden rounded-full border border-slate-200 bg-white/70">
        {([
          { value: "en", label: "EN" },
          { value: "ko", label: "KO" },
        ] as const).map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => handleChange(item.value)}
            disabled={loading}
            className={`px-3 py-1 text-xs font-semibold transition ${
              item.value === currentLocale
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
