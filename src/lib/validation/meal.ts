import { z } from "zod";
import { todayJstDateString } from "@/lib/utils/date";

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

/**
 * ChatGPTの出力形式は一定でなく、単一の datetime ではなく
 * date("YYYY-MM-DD") + time("HH:MM") に分かれて返ってくることがあるため、
 * datetime が無い場合はそこから合成する。
 */
function coalesceDatetimeFields(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;
  const obj = value as Record<string, unknown>;

  if (typeof obj.datetime === "string" && obj.datetime.trim()) return obj;

  const date = obj.date;
  if (typeof date !== "string" || !date.trim()) return obj;

  const time = obj.time;
  const timePart = typeof time === "string" && time.trim() ? time.trim() : "00:00";
  const normalizedTime = /^\d{2}:\d{2}$/.test(timePart) ? `${timePart}:00` : timePart;

  return { ...obj, datetime: `${date.trim()}T${normalizedTime}` };
}

export const mealJsonSchema = z.preprocess(
  coalesceDatetimeFields,
  z
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
    .passthrough(),
);

export type MealJson = z.infer<typeof mealJsonSchema>;

const DASH_ONLY_RE = /^[-ー–—]+$/;

/**
 * 体組成計アプリは項目未計測時に "-" や "-%" を表示することが多いため、
 * 空値・ダッシュ記号は「値なし」として扱う。
 */
function optionalNumberField(min: number, max: number) {
  return z.preprocess((value) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string") {
      const trimmed = value.trim().replace(/[%kg]+$/i, "");
      if (trimmed === "" || DASH_ONLY_RE.test(trimmed)) return undefined;
      return Number(trimmed);
    }
    return value;
  }, z.number().min(min).max(max).optional());
}

/**
 * 体組成計アプリのJSONは recorded_on が無く、date や datetime、
 * あるいは日付情報自体が省略されることがあるため補完する。
 */
function coalesceRecordedOn(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;
  const obj = value as Record<string, unknown>;

  if (typeof obj.recorded_on === "string" && obj.recorded_on.trim()) return obj;

  const date = obj.date;
  if (typeof date === "string" && date.trim()) {
    return { ...obj, recorded_on: date.trim().slice(0, 10) };
  }

  const datetime = obj.datetime;
  if (typeof datetime === "string" && datetime.trim()) {
    return { ...obj, recorded_on: datetime.trim().slice(0, 10) };
  }

  return { ...obj, recorded_on: todayJstDateString() };
}

export const weightLogSchema = z.preprocess(
  coalesceRecordedOn,
  z
    .object({
      recorded_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "recorded_onはYYYY-MM-DD形式で指定してください"),
      weight_kg: z.coerce.number().gt(0).max(500),
      body_fat_percent: optionalNumberField(0, 100),
      muscle_mass_kg: optionalNumberField(0, 300),
      bmi: optionalNumberField(0, 100),
      visceral_fat_level: optionalNumberField(0, 60),
      basal_metabolism_kcal: optionalNumberField(0, 10000),
      body_age: optionalNumberField(0, 150),
      bone_mass_kg: optionalNumberField(0, 50),
      muscle_quality_score: optionalNumberField(0, 200),
      body_water_percent: optionalNumberField(0, 100),
      note: z.string().max(500).optional().default(""),
    })
    .passthrough(),
);

export type WeightLogInput = z.infer<typeof weightLogSchema>;
