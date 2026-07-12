import Link from "next/link";
import type { Database } from "@/types/database";
import { toJstTimeString } from "@/lib/utils/date";

type MealRow = Database["public"]["Tables"]["meals"]["Row"];

const CATEGORY_ICON: Record<string, string> = {
  朝食: "🍳",
  昼食: "🍱",
  夕食: "🍚",
  間食: "🍪",
};

export function MealCard({ meal }: { meal: MealRow }) {
  return (
    <Link
      href={`/meals/${meal.id}`}
      className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition-colors hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-2xl dark:bg-zinc-800">
        {CATEGORY_ICON[meal.meal_type] ?? "🍽️"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{toJstTimeString(meal.eaten_at)}</span>
          <span>・</span>
          <span>{meal.meal_type}</span>
        </div>
        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {meal.menu_name}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {meal.calorie_kcal}kcal・P{meal.protein_g} F{meal.fat_g} C{meal.carbohydrate_g}
        </p>
        {meal.evaluation && (
          <p className="mt-0.5 truncate text-xs text-amber-700 dark:text-amber-500">
            {meal.evaluation}
          </p>
        )}
      </div>
    </Link>
  );
}
