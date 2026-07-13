"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatJstDateLabel, nextDateString, todayJstDateString } from "@/lib/utils/date";
import { DateCalendar } from "@/components/dashboard/DateCalendar";

function previousDateString(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00+09:00`);
  date.setUTCDate(date.getUTCDate() - 1);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(date);
}

export function DateNav({ date }: { date: string }) {
  const router = useRouter();
  const today = todayJstDateString();
  const isToday = date === today;
  const [calendarOpen, setCalendarOpen] = useState(false);

  function goTo(nextDate: string) {
    router.push(nextDate === today ? "/dashboard" : `/dashboard?date=${nextDate}`);
  }

  return (
    <div className="flex items-center justify-between gap-1">
      <button
        type="button"
        aria-label="前日"
        onClick={() => goTo(previousDateString(date))}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        ‹
      </button>

      <button
        type="button"
        onClick={() => setCalendarOpen(true)}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <span className="text-lg leading-none">📅</span>
        <span className="flex flex-col items-center">
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {isToday ? "今日" : formatJstDateLabel(date)}
          </span>
          {!isToday && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatJstDateLabel(date)}</span>
          )}
        </span>
      </button>

      <button
        type="button"
        aria-label="翌日"
        disabled={isToday}
        onClick={() => goTo(nextDateString(date))}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        ›
      </button>

      {calendarOpen && (
        <DateCalendar
          selectedDate={date}
          today={today}
          onSelect={(nextDate) => {
            setCalendarOpen(false);
            goTo(nextDate);
          }}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </div>
  );
}
