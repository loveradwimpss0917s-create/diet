"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { WeightChart } from "@/components/charts/WeightChart";
import { WeightManualForm } from "@/components/weight/WeightManualForm";
import { WeightJsonImport } from "@/components/weight/WeightJsonImport";
import { clsx } from "@/lib/utils/clsx";

interface WeightLog {
  id: string;
  recorded_on: string;
  weight_kg: number;
  body_fat_percent: number | null;
  muscle_mass_kg: number | null;
  bmi: number | null;
  visceral_fat_level: number | null;
  basal_metabolism_kcal: number | null;
  body_age: number | null;
  bone_mass_kg: number | null;
  muscle_quality_score: number | null;
  body_water_percent: number | null;
  note: string | null;
}

const PERIODS = [
  { key: "7d", label: "1週間", days: 7 },
  { key: "30d", label: "1ヶ月", days: 30 },
  { key: "90d", label: "3ヶ月", days: 90 },
  { key: "all", label: "全期間", days: null },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];
type InputMode = "manual" | "json";

const LATEST_METRICS: { key: keyof WeightLog; label: string; unit: string }[] = [
  { key: "body_fat_percent", label: "体脂肪率", unit: "%" },
  { key: "muscle_mass_kg", label: "筋肉量", unit: "kg" },
  { key: "bmi", label: "BMI", unit: "" },
  { key: "visceral_fat_level", label: "内臓脂肪レベル", unit: "" },
  { key: "basal_metabolism_kcal", label: "基礎代謝量", unit: "kcal" },
  { key: "body_age", label: "体内年齢", unit: "才" },
  { key: "bone_mass_kg", label: "推定骨量", unit: "kg" },
  { key: "muscle_quality_score", label: "筋質点数", unit: "" },
  { key: "body_water_percent", label: "体水分率", unit: "%" },
];

export function WeightPageClient({ targetWeightKg }: { targetWeightKg: number | null }) {
  const [mode, setMode] = useState<InputMode>("manual");
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback((activePeriod: PeriodKey, signal?: { cancelled: boolean }) => {
    const selected = PERIODS.find((p) => p.key === activePeriod)!;
    const params = new URLSearchParams();
    if (selected.days) {
      const from = new Date();
      from.setDate(from.getDate() - selected.days);
      params.set("from", from.toISOString().slice(0, 10));
    }

    return fetch(`/api/weight-logs?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!signal?.cancelled && data.success) setLogs(data.logs);
      })
      .finally(() => {
        if (!signal?.cancelled) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    fetchLogs(period, signal);
    return () => {
      signal.cancelled = true;
    };
  }, [period, fetchLogs]);

  const refetch = useCallback(() => {
    setLoading(true);
    return fetchLogs(period);
  }, [period, fetchLogs]);

  const latest = logs.length > 0 ? logs[logs.length - 1] : null;
  const latestMetrics = latest
    ? LATEST_METRICS.filter(({ key }) => latest[key] !== null && latest[key] !== undefined)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">体重管理</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          同じ日付で再登録すると上書きされます
        </p>
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={clsx(
            "flex-1 rounded-full px-3 py-2 text-sm font-medium",
            mode === "manual"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
          )}
        >
          手動入力
        </button>
        <button
          type="button"
          onClick={() => setMode("json")}
          className={clsx(
            "flex-1 rounded-full px-3 py-2 text-sm font-medium",
            mode === "json"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
          )}
        >
          JSON貼り付け
        </button>
      </div>

      {mode === "manual" ? (
        <WeightManualForm onRegistered={refetch} />
      ) : (
        <WeightJsonImport onRegistered={refetch} />
      )}

      {latest && latestMetrics.length > 0 && (
        <Card>
          <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            最新の測定値（{latest.recorded_on}）
          </p>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            {latestMetrics.map(({ key, label, unit }) => (
              <div key={key} className="contents">
                <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">
                  {String(latest[key])}
                  {unit}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      <Card>
        <div className="mb-3 flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setLoading(true);
                setPeriod(p.key);
              }}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-medium",
                period === p.key
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
            読み込み中...
          </div>
        ) : (
          <WeightChart data={logs} targetWeightKg={targetWeightKg} />
        )}
      </Card>
    </div>
  );
}
