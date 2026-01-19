"use client";

import { useMemo } from "react";

type DateTimeTextProps = {
  value: string | null | undefined;
  className?: string;
};

export default function DateTimeText({ value, className }: DateTimeTextProps) {
  const formatted = useMemo(() => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return "-";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }, [value]);

  return <span className={className}>{formatted}</span>;
}
