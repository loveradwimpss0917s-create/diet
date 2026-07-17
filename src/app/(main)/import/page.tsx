"use client";

import { useState } from "react";
import { clsx } from "@/lib/utils/clsx";
import { MealJsonImport } from "@/components/meals/MealJsonImport";
import { MealManualForm } from "@/components/meals/MealManualForm";

type InputMode = "json" | "manual";

export default function ImportPage() {
  const [mode, setMode] = useState<InputMode>("json");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">食事を登録</h1>
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setMode("json")}
          className={clsx(
            "flex-1 rounded-full px-3 py-2 text-sm font-medium",
            mode === "json" ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
          )}
        >
          JSON貼り付け
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={clsx(
            "flex-1 rounded-full px-3 py-2 text-sm font-medium",
            mode === "manual" ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
          )}
        >
          手入力
        </button>
      </div>

      {mode === "json" ? <MealJsonImport /> : <MealManualForm />}
    </div>
  );
}
