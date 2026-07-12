import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { mealJsonSchema } from "@/lib/validation/meal";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "ログインが必要です");
  }

  const { data, error } = await supabase
    .from("meals")
    .select("*, ingredients(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return apiError("NOT_FOUND", "食事記録が見つかりません");
  }

  return apiSuccess({ meal: data });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "ログインが必要です");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "JSONとして解析できませんでした");
  }

  const parsed = mealJsonSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return apiError("VALIDATION_ERROR", "入力内容に誤りがあります", details);
  }

  const meal = parsed.data;

  const { data: updatedMeal, error: updateError } = await supabase
    .from("meals")
    .update({
      eaten_at: meal.datetime,
      meal_type: meal.meal_type,
      meal_timing: meal.meal_timing ?? null,
      menu_name: meal.menu_name,
      category: meal.category || null,
      serving_size: meal.serving_size || null,
      calorie_kcal: meal.calorie_kcal,
      protein_g: meal.protein_g,
      fat_g: meal.fat_g,
      carbohydrate_g: meal.carbohydrate_g,
      fiber_g: meal.fiber_g,
      salt_g: meal.salt_g,
      confidence: meal.confidence ?? null,
      evaluation: meal.evaluation || null,
      advice: meal.advice || null,
      raw_json: body as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (updateError || !updatedMeal) {
    return apiError("NOT_FOUND", "食事記録が見つかりません");
  }

  const { error: deleteIngredientsError } = await supabase
    .from("ingredients")
    .delete()
    .eq("meal_id", id);

  if (deleteIngredientsError) {
    return apiError("INTERNAL_ERROR", "食材の更新に失敗しました");
  }

  if (meal.ingredients.length > 0) {
    const { error: insertIngredientsError } = await supabase.from("ingredients").insert(
      meal.ingredients.map((name, position) => ({
        meal_id: id,
        user_id: user.id,
        name,
        position,
      })),
    );

    if (insertIngredientsError) {
      return apiError("INTERNAL_ERROR", "食材の更新に失敗しました");
    }
  }

  return apiSuccess({ id: updatedMeal.id });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "ログインが必要です");
  }

  const { data, error } = await supabase
    .from("meals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !data) {
    return apiError("NOT_FOUND", "食事記録が見つかりません");
  }

  return apiSuccess({});
}
