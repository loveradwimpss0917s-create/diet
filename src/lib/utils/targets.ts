/**
 * 体組成計から得られる基礎代謝量(BMR)を基に、1日の栄養目標値を算出する。
 *
 * 計算方法:
 * - TDEE = 基礎代謝量 × 活動係数(1.3 = 軽い活動レベル。デバイス側で活動量を
 *   収集していないため、一般的な生活活動強度の目安値を固定で使用する)
 * - カロリー目標 = TDEE × 0.85（無理のない範囲である15%減を目安にした減量ペース）
 * - タンパク質目標 = 体重(kg) × 1.6g（減量中の筋量維持に必要とされる目安量）
 * - 脂質目標 = カロリー目標の25% ÷ 9kcal
 * - 炭水化物目標 = 残りカロリー ÷ 4kcal
 */
const ACTIVITY_FACTOR = 1.3;
const CALORIE_DEFICIT_RATIO = 0.85;
const PROTEIN_G_PER_KG = 1.6;
const FAT_CALORIE_RATIO = 0.25;

export interface DailyTargets {
  target_calorie_kcal: number;
  target_protein_g: number;
  target_fat_g: number;
  target_carbohydrate_g: number;
}

export function calculateDailyTargets(basalMetabolismKcal: number, weightKg: number): DailyTargets {
  const tdee = basalMetabolismKcal * ACTIVITY_FACTOR;
  const targetCalorie = Math.round((tdee * CALORIE_DEFICIT_RATIO) / 10) * 10;

  const proteinG = Math.round(weightKg * PROTEIN_G_PER_KG);
  const fatG = Math.round((targetCalorie * FAT_CALORIE_RATIO) / 9);
  const carbKcal = Math.max(targetCalorie - proteinG * 4 - fatG * 9, 0);
  const carbG = Math.round(carbKcal / 4);

  return {
    target_calorie_kcal: targetCalorie,
    target_protein_g: proteinG,
    target_fat_g: fatG,
    target_carbohydrate_g: carbG,
  };
}
