import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mealJsonSchema } from "@/lib/validation/meal";
import { apiError, apiSuccess } from "@/lib/api/response";
import { nextDateString } from "@/lib/utils/date";

export async function POST(request: NextRequest) {
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

  const { data: insertedMeal, error: insertError } = await supabase
    .from("meals")
    .insert({
      user_id: user.id,
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
      photo_url: null,
      raw_json: body as Record<string, unknown>,
    })
    .select("id")
    .single();

  if (insertError || !insertedMeal) {
    return apiError("INTERNAL_ERROR", "食事の登録に失敗しました");
  }

  if (meal.ingredients.length > 0) {
    const { error: ingredientsError } = await supabase.from("ingredients").insert(
      meal.ingredients.map((name, position) => ({
        meal_id: insertedMeal.id,
        user_id: user.id,
        name,
        position,
      })),
    );

    if (ingredientsError) {
      return apiError("INTERNAL_ERROR", "食材の登録に失敗しました");
    }
  }

  return apiSuccess({ id: insertedMeal.id }, 201);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "ログインが必要です");
  }

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50) || 50, 100);
  const offset = Number(searchParams.get("offset") ?? 0) || 0;

  let query = supabase
    .from("meals")
    .select("*, ingredients(*)", { count: "exact" })
    .eq("user_id", user.id)
    .order("eaten_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (date) {
    query = query
      .gte("eaten_at", `${date}T00:00:00+09:00`)
      .lt("eaten_at", `${nextDateString(date)}T00:00:00+09:00`);
  } else if (from || to) {
    if (from) query = query.gte("eaten_at", `${from}T00:00:00+09:00`);
    if (to) query = query.lt("eaten_at", `${nextDateString(to)}T00:00:00+09:00`);
  }

  const { data, error, count } = await query;

  if (error) {
    return apiError("INTERNAL_ERROR", "食事一覧の取得に失敗しました");
  }

  return apiSuccess({ meals: data ?? [], total: count ?? 0 });
}
