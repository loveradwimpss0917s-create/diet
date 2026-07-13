import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "ログインが必要です");
  }

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("summary_date", { ascending: true });

  if (from) query = query.gte("summary_date", from);
  if (to) query = query.lte("summary_date", to);

  const [{ data: summaries, error }, { data: profile }] = await Promise.all([
    query,
    supabase.from("users").select("*").eq("id", user.id).single(),
  ]);

  if (error) {
    return apiError("INTERNAL_ERROR", "日次サマリーの取得に失敗しました");
  }

  return apiSuccess({
    summaries: summaries ?? [],
    targets: profile
      ? {
          target_calorie_kcal: profile.target_calorie_kcal,
          target_protein_g: profile.target_protein_g,
          target_fat_g: profile.target_fat_g,
          target_carbohydrate_g: profile.target_carbohydrate_g,
          target_salt_g: profile.target_salt_g,
        }
      : null,
  });
}
