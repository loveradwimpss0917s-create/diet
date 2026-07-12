"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { todayJstDateString } from "@/lib/utils/date";

export function WeightManualForm({ onRegistered }: { onRegistered: () => void }) {
  const [recordedOn, setRecordedOn] = useState(todayJstDateString());
  const [weightKg, setWeightKg] = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    onRegistered();
  }

  return (
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
              step="0.01"
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

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "登録中..." : "記録する"}
        </Button>
      </form>
    </Card>
  );
}
