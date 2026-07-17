"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { todayJstDateString, toJstTimeString } from "@/lib/utils/date";

const MEAL_TYPES = ["朝食", "昼食", "夕食", "間食"] as const;
const MEAL_TIMINGS = ["", "朝", "昼", "夜", "深夜"] as const;

export function MealManualForm() {
  const router = useRouter();
  const [date, setDate] = useState(todayJstDateString());
  const [time, setTime] = useState(() => toJstTimeString(new Date().toISOString()));
  const [mealType, setMealType] = useState<string>("昼食");
  const [mealTiming, setMealTiming] = useState("");
  const [menuName, setMenuName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [calorieKcal, setCalorieKcal] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [fatG, setFatG] = useState("");
  const [carbohydrateG, setCarbohydrateG] = useState("");
  const [fiberG, setFiberG] = useState("");
  const [saltG, setSaltG] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function resetForm() {
    setMenuName("");
    setBrand("");
    setCategory("");
    setServingSize("");
    setCalorieKcal("");
    setProteinG("");
    setFatG("");
    setCarbohydrateG("");
    setFiberG("");
    setSaltG("");
    setIngredients("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const response = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        datetime: `${date}T${time}:00+09:00`,
        meal_type: mealType,
        meal_timing: mealTiming || undefined,
        menu_name: menuName,
        brand,
        // 手入力は実際に食べた本人が直接入力する情報のため「一般料理」として扱う
        recognition_type: "一般料理",
        category,
        serving_size: servingSize,
        ingredients: ingredients
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        calorie_kcal: Number(calorieKcal) || 0,
        protein_g: proteinG ? Number(proteinG) : 0,
        fat_g: fatG ? Number(fatG) : 0,
        carbohydrate_g: carbohydrateG ? Number(carbohydrateG) : 0,
        fiber_g: fiberG ? Number(fiberG) : 0,
        salt_g: saltG ? Number(saltG) : 0,
      }),
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok || !data.success) {
      setError(data.error?.message ?? "登録に失敗しました");
      return;
    }

    setSuccess(true);
    resetForm();
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        写真が撮れなかった場合など、食事内容を直接入力して登録します。
      </p>

      {success && (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            登録が完了しました
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" type="button" onClick={() => setSuccess(false)}>
              続けて登録
            </Button>
            <Button type="button" onClick={() => router.push("/meals")}>
              履歴を見る
            </Button>
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="manualDate">日付</Label>
            <Input id="manualDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="manualTime">時刻</Label>
            <Input id="manualTime" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="manualMealType">食事区分</Label>
            <Select
              id="manualMealType"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              required
            >
              {MEAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="manualMealTiming">食事タイミング</Label>
            <Select
              id="manualMealTiming"
              value={mealTiming}
              onChange={(e) => setMealTiming(e.target.value)}
            >
              {MEAL_TIMINGS.map((timing) => (
                <option key={timing} value={timing}>
                  {timing || "未設定"}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="manualMenuName">料理名</Label>
          <Input
            id="manualMenuName"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            placeholder="例: 鶏の唐揚げ定食"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="manualBrand">ブランド・商品名（任意）</Label>
            <Input
              id="manualBrand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="無印良品 など"
            />
          </div>
          <div>
            <Label htmlFor="manualCategory">カテゴリ</Label>
            <Input id="manualCategory" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="manualServingSize">分量</Label>
          <Input
            id="manualServingSize"
            value={servingSize}
            onChange={(e) => setServingSize(e.target.value)}
            placeholder="1人前 など"
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">栄養素</p>
        <div>
          <Label htmlFor="manualCalorieKcal">カロリー (kcal)</Label>
          <Input
            id="manualCalorieKcal"
            type="number"
            min={0}
            value={calorieKcal}
            onChange={(e) => setCalorieKcal(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="manualProteinG">P (g)</Label>
            <Input
              id="manualProteinG"
              type="number"
              min={0}
              step="0.1"
              value={proteinG}
              onChange={(e) => setProteinG(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="manualFatG">F (g)</Label>
            <Input
              id="manualFatG"
              type="number"
              min={0}
              step="0.1"
              value={fatG}
              onChange={(e) => setFatG(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="manualCarbohydrateG">C (g)</Label>
            <Input
              id="manualCarbohydrateG"
              type="number"
              min={0}
              step="0.1"
              value={carbohydrateG}
              onChange={(e) => setCarbohydrateG(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="manualFiberG">食物繊維 (g)</Label>
            <Input
              id="manualFiberG"
              type="number"
              min={0}
              step="0.1"
              value={fiberG}
              onChange={(e) => setFiberG(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="manualSaltG">塩分 (g)</Label>
            <Input
              id="manualSaltG"
              type="number"
              min={0}
              step="0.1"
              value={saltG}
              onChange={(e) => setSaltG(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <Label htmlFor="manualIngredients">食材（カンマ区切り・任意）</Label>
        <Input
          id="manualIngredients"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="鶏肉, キャベツ, ご飯"
        />
      </Card>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "登録中..." : "登録する"}
      </Button>
    </form>
  );
}
