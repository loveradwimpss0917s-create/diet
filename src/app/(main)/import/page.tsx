"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mealJsonSchema, type MealJson } from "@/lib/validation/meal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { MealPreviewCard } from "@/components/meals/MealPreviewCard";

const PLACEHOLDER = `{
  "datetime": "2026-07-12T21:56:00+09:00",
  "meal_type": "間食",
  "menu_name": "雪塩ちんすこう ミルク風味",
  "calorie_kcal": 120,
  "protein_g": 1,
  "fat_g": 6,
  "carbohydrate_g": 16
}`;

interface FieldError {
  path: string;
  message: string;
}

export default function ImportPage() {
  const router = useRouter();
  const [jsonText, setJsonText] = useState("");
  const [meal, setMeal] = useState<MealJson | null>(null);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!jsonText.trim()) {
        setMeal(null);
        setErrors([]);
        setParseError(null);
        return;
      }

      let raw: unknown;
      try {
        raw = JSON.parse(jsonText);
      } catch {
        setMeal(null);
        setErrors([]);
        setParseError("JSONとして解析できませんでした。貼り付けた内容を確認してください");
        return;
      }
      setParseError(null);

      const result = mealJsonSchema.safeParse(raw);
      if (!result.success) {
        setMeal(null);
        setErrors(
          result.error.issues.map((issue) => ({
            path: issue.path.join(".") || "(root)",
            message: issue.message,
          })),
        );
        return;
      }

      setErrors([]);
      setMeal(result.data);
    }, 300);

    return () => clearTimeout(timer);
  }, [jsonText]);

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      setJsonText(text);
      setSuccess(false);
    } catch {
      setParseError("クリップボードから読み取れませんでした。手動で貼り付けてください");
    }
  }

  async function handleRegister() {
    if (!meal) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonText,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setSubmitError(data.error?.message ?? "登録に失敗しました");
        return;
      }

      setSuccess(true);
      setJsonText("");
      setMeal(null);
    } catch {
      setSubmitError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">JSON Import</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          ChatGPTで解析した栄養JSONを貼り付けて登録します
        </p>
      </div>

      {success && (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            登録が完了しました
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => setSuccess(false)}>
              続けて登録
            </Button>
            <Button onClick={() => router.push("/meals")}>履歴を見る</Button>
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label htmlFor="json-input" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            JSON入力欄
          </label>
          <Button type="button" variant="secondary" onClick={handlePaste}>
            クリップボードから貼付
          </Button>
        </div>
        <Textarea
          id="json-input"
          rows={12}
          placeholder={PLACEHOLDER}
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setSuccess(false);
          }}
        />

        {parseError && <p className="text-sm text-red-600 dark:text-red-400">{parseError}</p>}

        {errors.length > 0 && (
          <div className="rounded-xl bg-red-50 p-3 dark:bg-red-950/40">
            <p className="mb-1 text-sm font-semibold text-red-700 dark:text-red-300">
              入力内容に誤りがあります
            </p>
            <ul className="list-inside list-disc text-sm text-red-700 dark:text-red-300">
              {errors.map((error) => (
                <li key={error.path}>
                  {error.path}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {meal && (
        <>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">プレビュー</p>
          <MealPreviewCard meal={meal} />

          {submitError && <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>}

          <Button onClick={handleRegister} disabled={submitting} className="w-full">
            {submitting ? "登録中..." : "登録する"}
          </Button>
        </>
      )}
    </div>
  );
}
