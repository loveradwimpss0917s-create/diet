import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MealEditForm } from "@/components/meals/MealEditForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MealEditPage({ params }: PageProps) {
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

  const ingredientNames = (meal.ingredients as { name: string; position: number }[])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((ingredient) => ingredient.name);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">食事記録を編集</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{meal.menu_name}</p>
      </div>

      <MealEditForm meal={meal} ingredientNames={ingredientNames} />
    </div>
  );
}
