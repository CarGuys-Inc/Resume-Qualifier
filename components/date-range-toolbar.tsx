"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

export default function DateRangeToolbar({
  activeRange,
  initialStartDate = "",
  initialEndDate = "",
}: {
  activeRange: string;
  initialStartDate?: string;
  initialEndDate?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  useEffect(() => {
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
  }, [initialStartDate, initialEndDate]);

  useEffect(() => {
    document
      .getElementById("resumes-processed-card")
      ?.classList.remove("is-loading");
  }, [activeRange, initialStartDate, initialEndDate]);

  const handleClick = (range: string) => {
    if (activeRange === range) return;
    document
      .getElementById("resumes-processed-card")
      ?.classList.add("is-loading");

    router.push(`${pathname}?range=${range}`);
  };

  const handleStartDate = (value: string) => {
    setStartDate(value);
  };

  const handleEndDate = (value: string) => {
    setEndDate(value);

    if (!startDate || !value) return;

    document
      .getElementById("resumes-processed-card")
      ?.classList.add("is-loading");

    router.push(`${pathname}?start=${startDate}&end=${value}`);
  };

  const activetBtnClass = (value: string) =>
    `w-full border rounded px-3 py-2 whitespace-nowrap transition-all duration-200 ${
      activeRange === value ? "bg-blue-600 text-white" : ""
    }`;

  const iconClass = (hasValue: string) =>
    hasValue ? "text-blue-600" : "text-gray-400";

  return (
    <div className="grid grid-cols-1 gap-3 pb-3 md:grid-cols-2 lg:items-center">
      {/* Date range stays on one row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="relative">
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={startDate}
            onChange={(e) => handleStartDate(e.target.value)}
          />
          <Calendar
            size={18}
            className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${iconClass(
              startDate,
            )}`}
          />
        </div>

        <span className="text-sm text-gray-500 text-center">to</span>

        <div className="relative">
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={endDate}
            onChange={(e) => handleEndDate(e.target.value)}
          />
          <Calendar
            size={18}
            className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${iconClass(
              endDate,
            )}`}
          />
        </div>
      </div>

      {/* Buttons stay on one row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          disabled={activeRange === "today"}
          onClick={() => handleClick("today")}
          className={activetBtnClass("today")}
        >
          Today
        </button>

        <button
          disabled={activeRange === "month"}
          onClick={() => handleClick("month")}
          className={activetBtnClass("month")}
        >
          Current Month
        </button>

        <button
          disabled={activeRange === "ytd"}
          onClick={() => handleClick("ytd")}
          className={activetBtnClass("ytd")}
        >
          Year to Date
        </button>
      </div>
    </div>
  );
}
