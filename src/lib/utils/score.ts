/**
 * 1日の食事記録を目標値との達成度から100点満点のスコアに変換する。
 *
 * 内訳（加重平均）:
 * - カロリー(40%): 目標の70%〜100%に収まっていれば満点。超過・過度な不足を減点。
 * - タンパク質(25%): 目標以上で満点。不足分に応じて減点（下回るほど減点）。
 * - 脂質(15%) / 炭水化物(10%) / 塩分(10%): 目標以下で満点。超過分に応じて減点。
 *
 * その日の食事記録が無い場合は算出対象外として null を返す。
 */
export interface DailyTargetsInput {
  target_calorie_kcal: number;
  target_protein_g: number;
  target_fat_g: number;
  target_carbohydrate_g: number;
  target_salt_g: number;
}

export interface DailyActualInput {
  total_calorie_kcal: number;
  total_protein_g: number;
  total_fat_g: number;
  total_carbohydrate_g: number;
  total_salt_g: number;
  meal_count: number;
}

export function calculateDailyScore(
  actual: DailyActualInput,
  target: DailyTargetsInput,
): number | null {
  if (!actual.meal_count) return null;

  const calorieScore = scoreWithinBand(actual.total_calorie_kcal, target.target_calorie_kcal, 0.7);
  const proteinScore = scoreAtLeast(actual.total_protein_g, target.target_protein_g);
  const fatScore = scoreAtMost(actual.total_fat_g, target.target_fat_g);
  const carbScore = scoreAtMost(actual.total_carbohydrate_g, target.target_carbohydrate_g);
  const saltScore = scoreAtMost(actual.total_salt_g, target.target_salt_g);

  const weighted =
    calorieScore * 0.4 + proteinScore * 0.25 + fatScore * 0.15 + carbScore * 0.1 + saltScore * 0.1;

  return Math.max(0, Math.min(100, Math.round(weighted)));
}

function scoreWithinBand(actual: number, target: number, lowerRatio: number): number {
  if (target <= 0) return 100;
  if (actual > target) {
    const overRatio = (actual - target) / target;
    return Math.max(0, Math.round(100 - overRatio * 150));
  }
  const lowerBound = target * lowerRatio;
  if (actual >= lowerBound) return 100;
  if (lowerBound <= 0) return 100;
  const underRatio = (lowerBound - actual) / lowerBound;
  return Math.max(0, Math.round(100 - underRatio * 100));
}

function scoreAtLeast(actual: number, target: number): number {
  if (target <= 0) return 100;
  if (actual >= target) return 100;
  return Math.max(0, Math.round((actual / target) * 100));
}

function scoreAtMost(actual: number, target: number): number {
  if (target <= 0) return 100;
  if (actual <= target) return 100;
  const overRatio = (actual - target) / target;
  return Math.max(0, Math.round(100 - overRatio * 100));
}
