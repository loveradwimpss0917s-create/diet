"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["users"]["Row"];

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [targetCalorie, setTargetCalorie] = useState(String(profile.target_calorie_kcal));
  const [targetProtein, setTargetProtein] = useState(String(profile.target_protein_g));
  const [targetFat, setTargetFat] = useState(String(profile.target_fat_g));
  const [targetCarb, setTargetCarb] = useState(String(profile.target_carbohydrate_g));
  const [targetSalt, setTargetSalt] = useState(String(profile.target_salt_g));
  const [targetWeight, setTargetWeight] = useState(
    profile.target_weight_kg ? String(profile.target_weight_kg) : "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("users")
      .update({
        display_name: displayName || null,
        target_calorie_kcal: Number(targetCalorie) || 0,
        target_protein_g: Number(targetProtein) || 0,
        target_fat_g: Number(targetFat) || 0,
        target_carbohydrate_g: Number(targetCarb) || 0,
        target_salt_g: Number(targetSalt) || 0,
        target_weight_kg: targetWeight ? Number(targetWeight) : null,
      })
      .eq("id", profile.id);

    setSaving(false);

    if (updateError) {
      setError("保存に失敗しました");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Card className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">プロフィール</p>
        <div>
          <Label htmlFor="displayName">表示名</Label>
          <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">1日の目標値</p>
        <div>
          <Label htmlFor="targetCalorie">カロリー (kcal)</Label>
          <Input
            id="targetCalorie"
            type="number"
            min={0}
            value={targetCalorie}
            onChange={(e) => setTargetCalorie(e.target.value)}
          />
        </div>
        <p className="-mb-1 text-xs text-zinc-400 dark:text-zinc-500">
          P：タンパク質 / F：脂質 / C：炭水化物
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="targetProtein">P・タンパク質 (g)</Label>
            <Input
              id="targetProtein"
              type="number"
              min={0}
              value={targetProtein}
              onChange={(e) => setTargetProtein(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="targetFat">F・脂質 (g)</Label>
            <Input
              id="targetFat"
              type="number"
              min={0}
              value={targetFat}
              onChange={(e) => setTargetFat(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="targetCarb">C・炭水化物 (g)</Label>
            <Input
              id="targetCarb"
              type="number"
              min={0}
              value={targetCarb}
              onChange={(e) => setTargetCarb(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="targetSalt">塩分 (g)</Label>
          <Input
            id="targetSalt"
            type="number"
            min={0}
            step="0.1"
            value={targetSalt}
            onChange={(e) => setTargetSalt(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="targetWeight">目標体重 (kg・任意)</Label>
          <Input
            id="targetWeight"
            type="number"
            min={0}
            step="0.1"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
          />
        </div>
      </Card>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">保存しました</p>}

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "保存中..." : "保存する"}
      </Button>
    </form>
  );
}
