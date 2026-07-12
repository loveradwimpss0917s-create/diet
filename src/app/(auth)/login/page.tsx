"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError("メールアドレスまたはパスワードが正しくありません");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-zinc-900">AI食事記録</h1>
        <p className="mb-8 text-center text-sm text-zinc-500">ログインして食事記録を始めましょう</p>

        <Card>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-zinc-500">
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="font-medium text-emerald-700">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
