import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { DeleteMealButton } from "@/components/meals/DeleteMealButton";
import { toJstDateString, toJstTimeString, formatJstDateLabel } from "@/lib/utils/date";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MealDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: meal } = await supabase
    .from("meals")
    .select("*, ingredients(*)")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!meal) {
    notFound();
  }

  const ingredients = (meal.ingredients as { id: string; name: string; position: number }[])
    .slice()
    .sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-zinc-500">
          {formatJstDateLabel(toJstDateString(meal.eaten_at))} {toJstTimeString(meal.eaten_at)}
          ・{meal.meal_type}
          {meal.meal_timing ? `・${meal.meal_timing}` : ""}
        </p>
        <h1 className="mt-1 text-xl font-bold text-zinc-900">{meal.menu_name}</h1>
        {meal.category && <p className="text-sm text-zinc-500">{meal.category}</p>}
      </div>

      <Card>
        <p className="mb-3 text-sm font-semibold text-zinc-700">栄養素</p>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <NutritionRow label="カロリー" value={`${meal.calorie_kcal} kcal`} />
          <NutritionRow label="タンパク質" value={`${meal.protein_g} g`} />
          <NutritionRow label="脂質" value={`${meal.fat_g} g`} />
          <NutritionRow label="炭水化物" value={`${meal.carbohydrate_g} g`} />
          <NutritionRow label="食物繊維" value={`${meal.fiber_g ?? 0} g`} />
          <NutritionRow label="塩分" value={`${meal.salt_g ?? 0} g`} />
          {meal.serving_size && <NutritionRow label="分量" value={meal.serving_size} />}
          {typeof meal.confidence === "number" && (
            <NutritionRow label="AI信頼度" value={`${meal.confidence}%`} />
          )}
        </dl>
      </Card>

      {ingredients.length > 0 && (
        <Card>
          <p className="mb-2 text-sm font-semibold text-zinc-700">食材</p>
          <div className="flex flex-wrap gap-1.5">
            {ingredients.map((ingredient) => (
              <span
                key={ingredient.id}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700"
              >
                {ingredient.name}
              </span>
            ))}
          </div>
        </Card>
      )}

      {meal.evaluation && (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-xs font-semibold text-amber-800">AI評価</p>
          <p className="mt-1 text-sm text-amber-900">{meal.evaluation}</p>
        </Card>
      )}

      {meal.advice && (
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-xs font-semibold text-emerald-800">AIアドバイス</p>
          <p className="mt-1 text-sm text-emerald-900">{meal.advice}</p>
        </Card>
      )}

      <DeleteMealButton mealId={meal.id} />
    </div>
  );
}

function NutritionRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium text-zinc-900">{value}</dd>
    </>
  );
}
