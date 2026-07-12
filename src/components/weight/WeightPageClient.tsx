"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { WeightChart } from "@/components/charts/WeightChart";
import { clsx } from "@/lib/utils/clsx";
import { todayJstDateString } from "@/lib/utils/date";

interface WeightLog {
  id: string;
  recorded_on: string;
  weight_kg: number;
  body_fat_percent: number | null;
  note: string | null;
}

const PERIODS = [
  { key: "7d", label: "1週間", days: 7 },
  { key: "30d", label: "1ヶ月", days: 30 },
  { key: "90d", label: "3ヶ月", days: 90 },
  { key: "all", label: "全期間", days: null },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

export function WeightPageClient({ targetWeightKg }: { targetWeightKg: number | null }) {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [recordedOn, setRecordedOn] = useState(todayJstDateString());
  const [weightKg, setWeightKg] = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const selected = PERIODS.find((p) => p.key === period)!;
    const params = new URLSearchParams();
    if (selected.days) {
      const from = new Date();
      from.setDate(from.getDate() - selected.days);
      params.set("from", from.toISOString().slice(0, 10));
    }

    fetch(`/api/weight-logs?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setLogs(data.logs);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const response = await fetch("/api/weight-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recorded_on: recordedOn,
        weight_kg: Number(weightKg),
        body_fat_percent: bodyFatPercent ? Number(bodyFatPercent) : undefined,
        note,
      }),
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok || !data.success) {
      setError(data.error?.message ?? "登録に失敗しました");
      return;
    }

    setWeightKg("");
    setBodyFatPercent("");
    setNote("");
    setPeriod((p) => p);
    router.refresh();
    // 再取得
    setLogs((prev) => {
      const next = prev.filter((l) => l.recorded_on !== recordedOn);
      next.push({
        id: data.id,
        recorded_on: recordedOn,
        weight_kg: Number(weightKg),
        body_fat_percent: bodyFatPercent ? Number(bodyFatPercent) : null,
        note,
      });
      return next.sort((a, b) => (a.recorded_on < b.recorded_on ? -1 : 1));
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">体重管理</h1>
        <p className="mt-1 text-sm text-zinc-500">同じ日付で再登録すると上書きされます</p>
      </div>

      <Card>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="recordedOn">日付</Label>
            <Input
              id="recordedOn"
              type="date"
              value={recordedOn}
              onChange={(e) => setRecordedOn(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="weightKg">体重 (kg)</Label>
              <Input
                id="weightKg"
                type="number"
                step="0.1"
                min={0}
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bodyFat">体脂肪率 (%)</Label>
              <Input
                id="bodyFat"
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={bodyFatPercent}
                onChange={(e) => setBodyFatPercent(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="note">メモ</Label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "登録中..." : "記録する"}
          </Button>
        </form>
      </Card>

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
                period === p.key ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
            読み込み中...
          </div>
        ) : (
          <WeightChart data={logs} targetWeightKg={targetWeightKg} />
        )}
      </Card>
    </div>
  );
}
