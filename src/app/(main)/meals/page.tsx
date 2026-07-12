import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MealCard } from "@/components/meals/MealCard";
import { Button } from "@/components/ui/Button";
import { toJstDateString, formatJstDateLabel } from "@/lib/utils/date";
import type { Database } from "@/types/database";

type MealRow = Database["public"]["Tables"]["meals"]["Row"];

export default async function MealHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: meals } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", user!.id)
    .order("eaten_at", { ascending: false })
    .limit(100);

  const groups = groupByJstDate(meals ?? []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">食事履歴</h1>
        <p className="mt-1 text-sm text-zinc-500">日付別の食事記録</p>
      </div>

      {groups.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 py-16 text-center">
          <p className="text-sm text-zinc-500">まだ食事記録がありません</p>
          <Link href="/import">
            <Button>＋ 最初の食事を登録する</Button>
          </Link>
        </div>
      )}

      {groups.map(({ date, meals: dayMeals, totalCalorie }) => (
        <section key={date}>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-zinc-700">{formatJstDateLabel(date)}</h2>
            <span className="text-xs text-zinc-500">合計 {totalCalorie}kcal</span>
          </div>
          <div className="flex flex-col gap-2">
            {dayMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupByJstDate(meals: MealRow[]) {
  const map = new Map<string, MealRow[]>();
  for (const meal of meals) {
    const date = toJstDateString(meal.eaten_at);
    const list = map.get(date) ?? [];
    list.push(meal);
    map.set(date, list);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, dayMeals]) => ({
      date,
      meals: dayMeals,
      totalCalorie: Math.round(dayMeals.reduce((sum, m) => sum + Number(m.calorie_kcal), 0)),
    }));
}
