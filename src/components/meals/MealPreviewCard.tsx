import type { MealJson } from "@/lib/validation/meal";
import { Card } from "@/components/ui/Card";
import { clsx } from "@/lib/utils/clsx";

export function MealPreviewCard({ meal }: { meal: MealJson }) {
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{meal.meal_type}</span>
          {meal.meal_timing && (
            <>
              <span>・</span>
              <span>{meal.meal_timing}</span>
            </>
          )}
          {meal.category && (
            <>
              <span>・</span>
              <span>{meal.category}</span>
            </>
          )}
        </div>
        <h2 className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">{meal.menu_name}</h2>
        {meal.serving_size && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{meal.serving_size}</p>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          {meal.calorie_kcal}
        </span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">kcal</span>
        {typeof meal.confidence === "number" && (
          <span
            className={clsx(
              "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
              meal.confidence >= 80
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
            )}
          >
            AI信頼度 {meal.confidence}%
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <NutrientTile label="P" value={meal.protein_g} color="text-blue-600 dark:text-blue-400" />
        <NutrientTile label="F" value={meal.fat_g} color="text-amber-600 dark:text-amber-400" />
        <NutrientTile label="C" value={meal.carbohydrate_g} color="text-red-600 dark:text-red-400" />
      </div>

      <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
        <span>食物繊維 {meal.fiber_g}g</span>
        <span>塩分 {meal.salt_g}g</span>
      </div>

      {meal.ingredients.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">食材</p>
          <div className="flex flex-wrap gap-1.5">
            {meal.ingredients.map((ingredient) => (
              <span
                key={ingredient}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {ingredient}
              </span>
            ))}
          </div>
        </div>
      )}

      {meal.evaluation && (
        <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/40">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">AI評価</p>
          <p className="mt-0.5 text-sm text-amber-900 dark:text-amber-200">{meal.evaluation}</p>
        </div>
      )}

      {meal.advice && (
        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            AIアドバイス
          </p>
          <p className="mt-0.5 text-sm text-emerald-900 dark:text-emerald-200">{meal.advice}</p>
        </div>
      )}
    </Card>
  );
}

function NutrientTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 py-2 dark:bg-zinc-800">
      <p className={clsx("text-lg font-bold", color)}>{value}g</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}
