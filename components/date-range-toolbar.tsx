"use client";

import { useRouter } from "next/navigation";
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
    document
      .getElementById("resumes-processed-card")
      ?.classList.add("is-loading");

    router.push(`/dashboard?range=${range}`);
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

    router.push(`/dashboard?start=${startDate}&end=${value}`);
  };

  const activetBtnClass = (value: string) =>
    `border rounded px-3 py-2 transition-all duration-200 ${
      activeRange === value ? "bg-blue-600 text-white" : ""
    }`;

  const iconClass = (hasValue: string) =>
    hasValue ? "text-blue-600" : "text-gray-400";

  return (
    <div className="flex justify-between items-center gap-2 pb-3">
      <div className="relative">
        <input
          type="date"
          className="border rounded px-3 py-2"
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
      <span>to</span>
      <div className="relative">
        <input
          type="date"
          className="border rounded px-3 py-2"
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

      <button
        onClick={() => handleClick("today")}
        className={activetBtnClass("today")}
      >
        Today
      </button>

      <button
        onClick={() => handleClick("month")}
        className={activetBtnClass("month")}
      >
        Current Month
      </button>

      <button
        onClick={() => handleClick("ytd")}
        className={activetBtnClass("ytd")}
      >
        Year to Date
      </button>
    </div>
  );
}
