import type { WeightLogInput } from "@/lib/validation/meal";
import { Card } from "@/components/ui/Card";

const METRIC_LABELS: { key: keyof WeightLogInput; label: string; unit: string }[] = [
  { key: "weight_kg", label: "体重", unit: "kg" },
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

export function BodyCompositionPreviewCard({ log }: { log: WeightLogInput }) {
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">記録日</p>
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{log.recorded_on}</p>
      </div>

      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        {METRIC_LABELS.map(({ key, label, unit }) => {
          const value = log[key];
          if (value === undefined || value === null) return null;
          return (
            <div key={key} className="contents">
              <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">
                {String(value)}
                {unit}
              </dd>
            </div>
          );
        })}
      </dl>

      {log.note && (
        <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">メモ</p>
          <p className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200">{log.note}</p>
        </div>
      )}
    </Card>
  );
}
