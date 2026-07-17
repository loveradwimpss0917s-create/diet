import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { mealJsonSchema, type MealJson } from "@/lib/validation/meal";
import { apiError, apiSuccess } from "@/lib/api/response";
import { nextDateString } from "@/lib/utils/date";
import type { Database } from "@/types/database";

async function insertMeal(
  supabase: SupabaseClient<Database>,
  userId: string,
  meal: MealJson,
  rawJson: Record<string, unknown>,
): Promise<{ id: string } | { error: string }> {
  const { data: insertedMeal, error: insertError } = await supabase
    .from("meals")
    .insert({
      user_id: userId,
      eaten_at: meal.datetime,
      meal_type: meal.meal_type,
      meal_timing: meal.meal_timing ?? null,
      menu_name: meal.menu_name,
      brand: meal.brand || null,
      recognition_type: meal.recognition_type,
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
      raw_json: rawJson,
    })
    .select("id")
    .single();

  if (insertError || !insertedMeal) {
    return { error: "食事の登録に失敗しました" };
  }

  if (meal.ingredients.length > 0) {
    const { error: ingredientsError } = await supabase.from("ingredients").insert(
      meal.ingredients.map((name, position) => ({
        meal_id: insertedMeal.id,
        user_id: userId,
        name,
        position,
      })),
    );

    if (ingredientsError) {
      return { error: "食材の登録に失敗しました" };
    }
  }

  return { id: insertedMeal.id };
}

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

  // 1枚の写真に複数の料理が写っている場合、ChatGPTがオブジェクトの配列で
  // 返すことがあるため、単一オブジェクトと配列の両方を受け付ける。
  const items = Array.isArray(body) ? body : [body];
  if (items.length === 0) {
    return apiError("VALIDATION_ERROR", "登録する食事データがありません");
  }

  const meals: MealJson[] = [];
  const details: { path: string; message: string }[] = [];

  items.forEach((item, index) => {
    const parsed = mealJsonSchema.safeParse(item);
    if (!parsed.success) {
      const prefix = Array.isArray(body) ? `[${index}].` : "";
      details.push(
        ...parsed.error.issues.map((issue) => ({
          path: `${prefix}${issue.path.join(".")}`,
          message: issue.message,
        })),
      );
    } else {
      meals.push(parsed.data);
    }
  });

  if (details.length > 0) {
    return apiError("VALIDATION_ERROR", "入力内容に誤りがあります", details);
  }

  const insertedIds: string[] = [];
  for (let i = 0; i < meals.length; i++) {
    const rawJson = Array.isArray(body) ? (body[i] as Record<string, unknown>) : (body as Record<string, unknown>);
    const result = await insertMeal(supabase, user.id, meals[i], rawJson);
    if ("error" in result) {
      return apiError("INTERNAL_ERROR", result.error);
    }
    insertedIds.push(result.id);
  }

  return apiSuccess({ id: insertedIds[0], ids: insertedIds, count: insertedIds.length }, 201);
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
