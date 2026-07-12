import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { weightLogSchema } from "@/lib/validation/meal";
import { apiError, apiSuccess } from "@/lib/api/response";

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

  const parsed = weightLogSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return apiError("VALIDATION_ERROR", "入力内容に誤りがあります", details);
  }

  const log = parsed.data;

  const { data, error } = await supabase
    .from("weight_logs")
    .upsert(
      {
        user_id: user.id,
        recorded_on: log.recorded_on,
        weight_kg: log.weight_kg,
        body_fat_percent: log.body_fat_percent ?? null,
        note: log.note || null,
      },
      { onConflict: "user_id,recorded_on" },
    )
    .select("id")
    .single();

  if (error || !data) {
    return apiError("INTERNAL_ERROR", "体重記録の登録に失敗しました");
  }

  return apiSuccess({ id: data.id }, 201);
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
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("recorded_on", { ascending: true });

  if (from) query = query.gte("recorded_on", from);
  if (to) query = query.lte("recorded_on", to);

  const { data, error } = await query;

  if (error) {
    return apiError("INTERNAL_ERROR", "体重記録の取得に失敗しました");
  }

  return apiSuccess({ logs: data ?? [] });
}
