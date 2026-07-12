import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MealCard } from "@/components/meals/MealCard";
import { todayJstDateString, nextDateString, formatJstDateLabel } from "@/lib/utils/date";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = todayJstDateString();

  const [{ data: profile }, { data: summary }, { data: todayMeals }] = await Promise.all([
    supabase.from("users").select("*").eq("id", user!.id).single(),
    supabase
      .from("daily_summaries")
      .select("*")
      .eq("user_id", user!.id)
      .eq("summary_date", today)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("*")
      .eq("user_id", user!.id)
      .gte("eaten_at", `${today}T00:00:00+09:00`)
      .lt("eaten_at", `${nextDateString(today)}T00:00:00+09:00`)
      .order("eaten_at", { ascending: false }),
  ]);

  const targetCalorie = profile?.target_calorie_kcal ?? 2000;
  const currentCalorie = summary?.total_calorie_kcal ?? 0;
  const remaining = targetCalorie - currentCalorie;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">{formatJstDateLabel(today)}</h1>
        <p className="mt-1 text-sm text-zinc-500">今日の摂取量</p>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-emerald-600">{Math.round(currentCalorie)}</p>
          <p className="text-sm text-zinc-500">
            / {targetCalorie} kcal
            {remaining >= 0 ? (
              <span className="ml-2 text-emerald-600">残り {Math.round(remaining)}kcal</span>
            ) : (
              <span className="ml-2 text-red-600">+{Math.round(-remaining)}kcal 超過</span>
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
          <h2 className="text-sm font-semibold text-zinc-700">今日の食事</h2>
          <Link href="/import" className="text-xs font-medium text-emerald-700">
            ＋ 登録する
          </Link>
        </div>

        {todayMeals && todayMeals.length > 0 ? (
          <div className="flex flex-col gap-2">
            {todayMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 py-10 text-center">
            <p className="text-sm text-zinc-500">今日はまだ食事記録がありません</p>
            <Link href="/import">
              <Button>＋ 食事を登録する</Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
