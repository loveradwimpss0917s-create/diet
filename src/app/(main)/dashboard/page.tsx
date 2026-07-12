import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MealCard } from "@/components/meals/MealCard";
import { DateNav } from "@/components/dashboard/DateNav";
import { todayJstDateString, nextDateString } from "@/lib/utils/date";

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const today = todayJstDateString();
  const selectedDate = params.date && DATE_RE.test(params.date) && params.date <= today ? params.date : today;
  const isToday = selectedDate === today;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: summary }, { data: dayMeals }] = await Promise.all([
    supabase.from("users").select("*").eq("id", user!.id).single(),
    supabase
      .from("daily_summaries")
      .select("*")
      .eq("user_id", user!.id)
      .eq("summary_date", selectedDate)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("*")
      .eq("user_id", user!.id)
      .gte("eaten_at", `${selectedDate}T00:00:00+09:00`)
      .lt("eaten_at", `${nextDateString(selectedDate)}T00:00:00+09:00`)
      .order("eaten_at", { ascending: false }),
  ]);

  const targetCalorie = profile?.target_calorie_kcal ?? 2000;
  const currentCalorie = summary?.total_calorie_kcal ?? 0;
  const remaining = targetCalorie - currentCalorie;

  return (
    <div className="flex flex-col gap-6">
      <DateNav date={selectedDate} />

      <Card className="flex flex-col gap-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
            {Math.round(currentCalorie)}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            / {targetCalorie} kcal
            {remaining >= 0 ? (
              <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                残り {Math.round(remaining)}kcal
              </span>
            ) : (
              <span className="ml-2 text-red-600 dark:text-red-400">
                +{Math.round(-remaining)}kcal 超過
              </span>
            )}
          </p>
        </div>

        <ProgressBar
          label="カロリー"
          current={currentCalorie}
          target={targetCalorie}
          unit="kcal"
          colorClassName="bg-emerald-500"
        />
        <ProgressBar
          label="タンパク質 (P)"
          current={summary?.total_protein_g ?? 0}
          target={profile?.target_protein_g ?? 60}
          unit="g"
          colorClassName="bg-blue-500"
        />
        <ProgressBar
          label="脂質 (F)"
          current={summary?.total_fat_g ?? 0}
          target={profile?.target_fat_g ?? 60}
          unit="g"
          colorClassName="bg-amber-500"
        />
        <ProgressBar
          label="炭水化物 (C)"
          current={summary?.total_carbohydrate_g ?? 0}
          target={profile?.target_carbohydrate_g ?? 300}
          unit="g"
          colorClassName="bg-red-500"
        />
        <ProgressBar
          label="塩分"
          current={summary?.total_salt_g ?? 0}
          target={profile?.target_salt_g ?? 7.5}
          unit="g"
          colorClassName="bg-purple-500"
        />
      </Card>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {isToday ? "今日の食事" : `${selectedDate}の食事`}
          </h2>
          {isToday && (
            <Link href="/import" className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              ＋ 登録する
            </Link>
          )}
        </div>

        {dayMeals && dayMeals.length > 0 ? (
          <div className="flex flex-col gap-2">
            {dayMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isToday ? "今日はまだ食事記録がありません" : "この日の食事記録はありません"}
            </p>
            {isToday && (
              <Link href="/import">
                <Button>＋ 食事を登録する</Button>
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
