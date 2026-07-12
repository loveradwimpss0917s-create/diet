import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { LogoutButton } from "@/components/settings/LogoutButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("users").select("*").eq("id", user!.id).single();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">設定</h1>
        <p className="mt-1 text-sm text-zinc-500">{user?.email}</p>
      </div>

      {profile && <SettingsForm profile={profile} />}

      <LogoutButton />
    </div>
  );
}
