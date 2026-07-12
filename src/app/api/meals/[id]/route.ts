import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api/response";

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
