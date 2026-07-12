-- weight_logs拡張: 体組成計アプリのスクリーンショットをChatGPT解析した
-- JSONを貼り付けて記録できるようにするため、体重・体脂肪率以外の項目を追加する。
-- 参照: HealthPlanet等の体組成計アプリが表示する項目
alter table public.weight_logs
  add column muscle_mass_kg numeric(5, 2),
  add column bmi numeric(4, 1),
  add column visceral_fat_level numeric(4, 1),
  add column basal_metabolism_kcal integer,
  add column body_age integer,
  add column bone_mass_kg numeric(4, 2),
  add column muscle_quality_score numeric(5, 1),
  add column body_water_percent numeric(4, 1),
  add column raw_json jsonb;
