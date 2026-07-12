import { createClient } from "@/lib/supabase/server";
import { WeightPageClient } from "@/components/weight/WeightPageClient";

export default async function WeightPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("target_weight_kg")
    .eq("id", user!.id)
    .single();

  return <WeightPageClient targetWeightKg={profile?.target_weight_kg ?? null} />;
}
