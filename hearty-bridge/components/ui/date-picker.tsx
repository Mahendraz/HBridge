"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

interface DatePickerProps {
  /** Current value in YYYY-MM-DD format, or empty string */
  value?: string;
  /** Called with YYYY-MM-DD when all three parts are selected, or "" when all cleared */
  onChange?: (val: string) => void;
  /** Minimum selectable date in YYYY-MM-DD format */
  min?: string;
  /** Maximum selectable date in YYYY-MM-DD format */
  max?: string;
  className?: string;
  disabled?: boolean;
}

function parseValue(value: string) {
  const parts = value ? value.split("-") : [];
  return {
    y: parts[0] ? parseInt(parts[0]) : 0,
    m: parts[1] ? parseInt(parts[1]) : 0,
    d: parts[2] ? parseInt(parts[2]) : 0,
  };
}

/**
 * Three-dropdown date picker (Tgl / Bulan / Tahun).
 * Drop-in replacement for <Input type="date"> — same value/onChange API.
 *
 * Uses internal state so partial selections (e.g. picking day before month/year)
 * persist without calling onChange("") until all three are filled.
 */
export function DatePicker({
  value = "",
  onChange,
  min,
  max,
  className,
  disabled,
}: DatePickerProps) {
  const parsed = parseValue(value);

  // Internal state tracks partial selections independently of the value prop
  const [localDay, setLocalDay] = useState(parsed.d);
  const [localMonth, setLocalMonth] = useState(parsed.m);
  const [localYear, setLocalYear] = useState(parsed.y);

  // Sync internal state when the external value changes (e.g. form reset)
  useEffect(() => {
    const { y, m, d } = parseValue(value);
    setLocalYear(y);
    setLocalMonth(m);
    setLocalDay(d);
  }, [value]);

  // Determine year bounds
  const today = new Date();
  const minYear = min ? parseInt(min.split("-")[0]) : 1920;
  const maxYear = max ? parseInt(max.split("-")[0]) : today.getFullYear() + 20;

  // Years: newest first
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i
  );

  // Days in the currently selected month/year (default 31)
  const daysInMonth =
    localYear && localMonth ? new Date(localYear, localMonth, 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Clamp day if the new month/year has fewer days
  const clampDay = (newYear: number, newMonth: number, currentDay: number) => {
    if (!newYear || !newMonth || !currentDay) return currentDay;
    const maxDay = new Date(newYear, newMonth, 0).getDate();
    return currentDay > maxDay ? maxDay : currentDay;
  };

  // Emit to parent: only emit a full date when all three are set;
  // emit "" only when all three are cleared (not during intermediate selection).
  const emit = (y: number, m: number, d: number) => {
    if (!onChange) return;
    if (y && m && d) {
      const dd = String(d).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      onChange(`${y}-${mm}-${dd}`);
    } else if (!y && !m && !d) {
      onChange("");
    }
    // Partial selection (some fields filled, some not) → do not call onChange
  };

  const handleDayChange = (d: number) => {
    setLocalDay(d);
    emit(localYear, localMonth, d);
  };

  const handleMonthChange = (m: number) => {
    const clamped = clampDay(localYear, m, localDay);
    setLocalMonth(m);
    if (clamped !== localDay) setLocalDay(clamped);
    emit(localYear, m, clamped);
  };

  const handleYearChange = (y: number) => {
    const clamped = clampDay(y, localMonth, localDay);
    setLocalYear(y);
    if (clamped !== localDay) setLocalDay(clamped);
    emit(y, localMonth, clamped);
  };

  const selectClass =
    "border border-gray-300 rounded-md px-2 py-2 text-sm bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent " +
    "disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Day */}
      <select
        value={localDay || ""}
        onChange={(e) => handleDayChange(Number(e.target.value))}
        disabled={disabled}
        className={cn(selectClass, "w-[70px]")}
      >
        <option value="">Tgl</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      {/* Month */}
      <select
        value={localMonth || ""}
        onChange={(e) => handleMonthChange(Number(e.target.value))}
        disabled={disabled}
        className={cn(selectClass, "flex-1")}
      >
        <option value="">Bulan</option>
        {MONTHS.map((name, i) => (
          <option key={i + 1} value={i + 1}>
            {name}
          </option>
        ))}
      </select>

      {/* Year */}
      <select
        value={localYear || ""}
        onChange={(e) => handleYearChange(Number(e.target.value))}
        disabled={disabled}
        className={cn(selectClass, "w-[90px]")}
      >
        <option value="">Tahun</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
