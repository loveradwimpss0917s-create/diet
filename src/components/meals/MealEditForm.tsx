"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { toJstDateString, toJstTimeString } from "@/lib/utils/date";
import type { Database } from "@/types/database";

type MealRow = Database["public"]["Tables"]["meals"]["Row"];

const MEAL_TYPES = ["朝食", "昼食", "夕食", "間食"] as const;
const MEAL_TIMINGS = ["", "朝", "昼", "夜", "深夜"] as const;

interface MealEditFormProps {
  meal: MealRow;
  ingredientNames: string[];
}

export function MealEditForm({ meal, ingredientNames }: MealEditFormProps) {
  const router = useRouter();
  const [date, setDate] = useState(toJstDateString(meal.eaten_at));
  const [time, setTime] = useState(toJstTimeString(meal.eaten_at));
  const [mealType, setMealType] = useState<string>(meal.meal_type);
  const [mealTiming, setMealTiming] = useState<string>(meal.meal_timing ?? "");
  const [menuName, setMenuName] = useState(meal.menu_name);
  const [category, setCategory] = useState(meal.category ?? "");
  const [servingSize, setServingSize] = useState(meal.serving_size ?? "");
  const [calorieKcal, setCalorieKcal] = useState(String(meal.calorie_kcal));
  const [proteinG, setProteinG] = useState(String(meal.protein_g));
  const [fatG, setFatG] = useState(String(meal.fat_g));
  const [carbohydrateG, setCarbohydrateG] = useState(String(meal.carbohydrate_g));
  const [fiberG, setFiberG] = useState(String(meal.fiber_g ?? 0));
  const [saltG, setSaltG] = useState(String(meal.salt_g ?? 0));
  const [ingredients, setIngredients] = useState(ingredientNames.join(", "));
  const [evaluation, setEvaluation] = useState(meal.evaluation ?? "");
  const [advice, setAdvice] = useState(meal.advice ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/meals/${meal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        datetime: `${date}T${time}:00+09:00`,
        meal_type: mealType,
        meal_timing: mealTiming || undefined,
        menu_name: menuName,
        category,
        serving_size: servingSize,
        ingredients: ingredients
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        calorie_kcal: Number(calorieKcal),
        protein_g: Number(proteinG),
        fat_g: Number(fatG),
        carbohydrate_g: Number(carbohydrateG),
        fiber_g: Number(fiberG),
        salt_g: Number(saltG),
        confidence: meal.confidence ?? undefined,
        evaluation,
        advice,
      }),
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok || !data.success) {
      setError(data.error?.message ?? "更新に失敗しました");
      return;
    }

    router.push(`/meals/${meal.id}`);
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Card className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="date">日付</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="time">時刻</Label>
            <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="mealType">食事区分</Label>
            <Select id="mealType" value={mealType} onChange={(e) => setMealType(e.target.value)} required>
              {MEAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="mealTiming">食事タイミング</Label>
            <Select id="mealTiming" value={mealTiming} onChange={(e) => setMealTiming(e.target.value)}>
              {MEAL_TIMINGS.map((timing) => (
                <option key={timing} value={timing}>
                  {timing || "未設定"}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="menuName">料理名</Label>
          <Input id="menuName" value={menuName} onChange={(e) => setMenuName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="category">カテゴリ</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="servingSize">分量</Label>
            <Input id="servingSize" value={servingSize} onChange={(e) => setServingSize(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">栄養素</p>
        <div>
          <Label htmlFor="calorieKcal">カロリー (kcal)</Label>
          <Input
            id="calorieKcal"
            type="number"
            min={0}
            value={calorieKcal}
            onChange={(e) => setCalorieKcal(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="proteinG">P (g)</Label>
            <Input
              id="proteinG"
              type="number"
              min={0}
              step="0.1"
              value={proteinG}
              onChange={(e) => setProteinG(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fatG">F (g)</Label>
            <Input
              id="fatG"
              type="number"
              min={0}
              step="0.1"
              value={fatG}
              onChange={(e) => setFatG(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="carbohydrateG">C (g)</Label>
            <Input
              id="carbohydrateG"
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
            <Label htmlFor="fiberG">食物繊維 (g)</Label>
            <Input
              id="fiberG"
              type="number"
              min={0}
              step="0.1"
              value={fiberG}
              onChange={(e) => setFiberG(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="saltG">塩分 (g)</Label>
            <Input
              id="saltG"
              type="number"
              min={0}
              step="0.1"
              value={saltG}
              onChange={(e) => setSaltG(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <div>
          <Label htmlFor="ingredients">食材（カンマ区切り）</Label>
          <Input
            id="ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="鶏肉, キャベツ, ご飯"
          />
        </div>
        <div>
          <Label htmlFor="evaluation">AI評価</Label>
          <Textarea
            id="evaluation"
            rows={2}
            className="font-sans text-base"
            value={evaluation}
            onChange={(e) => setEvaluation(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="advice">AIアドバイス</Label>
          <Textarea
            id="advice"
            rows={2}
            className="font-sans text-base"
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
          />
        </div>
      </Card>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "保存中..." : "保存する"}
      </Button>
    </form>
  );
}
