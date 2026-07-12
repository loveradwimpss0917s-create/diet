"use client";

import { useRouter } from "next/navigation";
import { formatJstDateLabel, nextDateString, todayJstDateString } from "@/lib/utils/date";

function previousDateString(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00+09:00`);
  date.setUTCDate(date.getUTCDate() - 1);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(date);
}

export function DateNav({ date }: { date: string }) {
  const router = useRouter();
  const today = todayJstDateString();
  const isToday = date === today;

  function goTo(nextDate: string) {
    router.push(nextDate === today ? "/dashboard" : `/dashboard?date=${nextDate}`);
  }

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        aria-label="前日"
        onClick={() => goTo(previousDateString(date))}
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        ‹
      </button>

      <div className="relative flex flex-1 cursor-pointer flex-col items-center">
        <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {isToday ? "今日" : formatJstDateLabel(date)}
        </span>
        {!isToday && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatJstDateLabel(date)}</span>
        )}
        <input
          type="date"
          aria-label="日付を選択"
          value={date}
          max={today}
          onChange={(e) => e.target.value && goTo(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      <button
        type="button"
        aria-label="翌日"
        disabled={isToday}
        onClick={() => goTo(nextDateString(date))}
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        ›
      </button>
    </div>
  );
}
