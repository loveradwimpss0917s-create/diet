"use client";

import { useEffect, useMemo, useState } from "react";
import { clsx } from "@/lib/utils/clsx";
import { calculateDailyScore, type DailyActualInput, type DailyTargetsInput } from "@/lib/utils/score";

interface DateCalendarProps {
  selectedDate: string;
  today: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}

interface DaySummary extends DailyActualInput {
  summary_date: string;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function toYearMonth(date: string): string {
  return date.slice(0, 7);
}

function buildMonthGrid(yearMonth: string): { date: string; day: number; inMonth: boolean }[] {
  const [year, month] = yearMonth.split("-").map(Number);
  const startWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  const cells: { date: string; day: number; inMonth: boolean }[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ date: "", day: daysInPrevMonth - i, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: "", day: cells.length, inMonth: false });
  }

  return cells;
}

function shiftYearMonth(yearMonth: string, delta: number): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function scoreBadgeClass(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  if (score >= 50) return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
}

export function DateCalendar({ selectedDate, today, onSelect, onClose }: DateCalendarProps) {
  const [viewMonth, setViewMonth] = useState(toYearMonth(selectedDate));
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const grid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  useEffect(() => {
    let cancelled = false;

    const [year, month] = viewMonth.split("-").map(Number);
    const from = `${viewMonth}-01`;
    const to = `${viewMonth}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;

    fetch(`/api/daily-summaries?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.success || !data.targets) return;
        const targets: DailyTargetsInput = data.targets;
        const nextScores: Record<string, number> = {};
        for (const summary of data.summaries as DaySummary[]) {
          const score = calculateDailyScore(summary, targets);
          if (score !== null) nextScores[summary.summary_date] = score;
        }
        setScores(nextScores);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [viewMonth]);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-xl dark:bg-zinc-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="前月"
            onClick={() => {
              setLoading(true);
              setViewMonth((m) => shiftYearMonth(m, -1));
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            ‹
          </button>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {viewMonth.replace("-", "年")}月
          </p>
          <button
            type="button"
            aria-label="翌月"
            disabled={viewMonth >= toYearMonth(today)}
            onClick={() => {
              setLoading(true);
              setViewMonth((m) => shiftYearMonth(m, 1));
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400 dark:text-zinc-500">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, i) => {
            if (!cell.inMonth) {
              return <div key={i} className="aspect-square" />;
            }
            const isFuture = cell.date > today;
            const isSelected = cell.date === selectedDate;
            const isToday = cell.date === today;
            const score = scores[cell.date];

            return (
              <button
                key={cell.date}
                type="button"
                disabled={isFuture}
                onClick={() => onSelect(cell.date)}
                className={clsx(
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-xs disabled:opacity-30",
                  isSelected
                    ? "bg-emerald-600 text-white"
                    : isToday
                      ? "border border-emerald-500 text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                )}
              >
                <span>{cell.day}</span>
                {!loading && typeof score === "number" && !isSelected && (
                  <span
                    className={clsx(
                      "rounded-full px-1 text-[10px] font-semibold leading-tight",
                      scoreBadgeClass(score),
                    )}
                  >
                    {score}
                  </span>
                )}
                {!loading && typeof score === "number" && isSelected && (
                  <span className="text-[10px] font-semibold leading-tight text-emerald-100">
                    {score}点
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
          数字は目標達成度スコア（100点満点）。記録がある日のみ表示されます。
        </p>
      </div>
    </div>
  );
}
