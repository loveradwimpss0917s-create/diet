"use client";

import { useEffect, useState } from "react";
import { weightLogSchema, type WeightLogInput } from "@/lib/validation/meal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { BodyCompositionPreviewCard } from "@/components/weight/BodyCompositionPreviewCard";

const PLACEHOLDER = `{
  "recorded_on": "2026-07-12",
  "weight_kg": 96.05,
  "body_fat_percent": 33.9,
  "muscle_mass_kg": 60.15,
  "bmi": 30.3,
  "visceral_fat_level": 14.0,
  "basal_metabolism_kcal": 1852,
  "body_age": 44,
  "bone_mass_kg": 3.30
}`;

interface FieldError {
  path: string;
  message: string;
}

export function WeightJsonImport({ onRegistered }: { onRegistered: () => void }) {
  const [jsonText, setJsonText] = useState("");
  const [log, setLog] = useState<WeightLogInput | null>(null);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!jsonText.trim()) {
        setLog(null);
        setErrors([]);
        setParseError(null);
        return;
      }

      let raw: unknown;
      try {
        raw = JSON.parse(jsonText);
      } catch {
        setLog(null);
        setErrors([]);
        setParseError("JSONとして解析できませんでした。貼り付けた内容を確認してください");
        return;
      }
      setParseError(null);

      const result = weightLogSchema.safeParse(raw);
      if (!result.success) {
        setLog(null);
        setErrors(
          result.error.issues.map((issue) => ({
            path: issue.path.join(".") || "(root)",
            message: issue.message,
          })),
        );
        return;
      }

      setErrors([]);
      setLog(result.data);
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
    if (!log) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/weight-logs", {
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
      setLog(null);
      onRegistered();
    } catch {
      setSubmitError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-500">
        体組成計アプリの画面をスクリーンショットし、ChatGPTで解析したJSONを貼り付けると、体重以外の項目もまとめて記録できます。
      </p>

      {success && (
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-medium text-emerald-800">登録が完了しました</p>
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label htmlFor="weight-json-input" className="text-sm font-medium text-zinc-700">
            JSON入力欄
          </label>
          <Button type="button" variant="secondary" onClick={handlePaste}>
            クリップボードから貼付
          </Button>
        </div>
        <Textarea
          id="weight-json-input"
          rows={10}
          placeholder={PLACEHOLDER}
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setSuccess(false);
          }}
        />

        {parseError && <p className="text-sm text-red-600">{parseError}</p>}

        {errors.length > 0 && (
          <div className="rounded-xl bg-red-50 p-3">
            <p className="mb-1 text-sm font-semibold text-red-700">入力内容に誤りがあります</p>
            <ul className="list-inside list-disc text-sm text-red-700">
              {errors.map((error) => (
                <li key={error.path}>
                  {error.path}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {log && (
        <>
          <p className="text-sm font-medium text-zinc-700">プレビュー</p>
          <BodyCompositionPreviewCard log={log} />

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <Button onClick={handleRegister} disabled={submitting} className="w-full">
            {submitting ? "登録中..." : "登録する"}
          </Button>
        </>
      )}
    </div>
  );
}
