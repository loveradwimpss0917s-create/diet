import { z } from "zod";

const MEAL_TYPES = ["朝食", "昼食", "夕食", "間食"] as const;
const MEAL_TIMINGS = ["朝", "昼", "夜", "深夜"] as const;

/**
 * ChatGPT出力は数値が文字列で来ることがあるため、空値以外は数値へ変換してから検証する。
 */
function numberField(min: number, max: number, defaultValue: number) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return undefined;
    return typeof value === "string" ? Number(value) : value;
  }, z.number({ message: "数値を指定してください" }).min(min).max(max).optional().default(defaultValue));
}

const DATETIME_OFFSET_RE = /(Z|[+-]\d{2}:?\d{2})$/;

/**
 * datetime にタイムゾーンオフセットが無い場合、JST(+09:00)とみなして補完する。
 */
function normalizeDatetime(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (DATETIME_OFFSET_RE.test(trimmed)) return trimmed;
  return `${trimmed}+09:00`;
}

export const mealJsonSchema = z
  .object({
    datetime: z.preprocess(
      normalizeDatetime,
      z.string().datetime({ offset: true, message: "datetimeはISO8601形式で指定してください" }),
    ),
    meal_type: z.enum(MEAL_TYPES, {
      message: `meal_typeは ${MEAL_TYPES.join(" / ")} のいずれかを指定してください`,
    }),
    meal_timing: z.enum(MEAL_TIMINGS).optional(),
    menu_name: z.string().min(1, "menu_nameは必須です").max(200),
    category: z.string().max(100).optional().default(""),
    ingredients: z.array(z.string().min(1).max(100)).max(50).optional().default([]),
    serving_size: z.string().max(50).optional().default(""),
    calorie_kcal: numberField(0, 10000, 0),
    protein_g: numberField(0, 1000, 0),
    fat_g: numberField(0, 1000, 0),
    carbohydrate_g: numberField(0, 1000, 0),
    fiber_g: numberField(0, 500, 0),
    salt_g: numberField(0, 100, 0),
    confidence: z.preprocess((value) => {
      if (value === undefined || value === null || value === "") return undefined;
      return typeof value === "string" ? Number(value) : value;
    }, z.number().int().min(0).max(100).optional()),
    evaluation: z.string().max(1000).optional().default(""),
    advice: z.string().max(2000).optional().default(""),
  })
  .passthrough();

export type MealJson = z.infer<typeof mealJsonSchema>;

export const weightLogSchema = z.object({
  recorded_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "recorded_onはYYYY-MM-DD形式で指定してください"),
  weight_kg: z.coerce.number().gt(0).max(500),
  body_fat_percent: z
    .preprocess((value) => (value === undefined || value === null || value === "" ? undefined : value), z.coerce.number().min(0).max(100).optional()),
  note: z.string().max(500).optional().default(""),
});

export type WeightLogInput = z.infer<typeof weightLogSchema>;
