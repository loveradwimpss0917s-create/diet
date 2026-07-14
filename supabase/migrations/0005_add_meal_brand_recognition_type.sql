-- 写真のみからの一般化した料理名推定と、実際の商品(ブランド名付き市販食品)との
-- 乖離を減らすため、meals にブランド名と認識タイプを追加する。
-- recognition_type:
--   '商品'    = 商品名・ブランドまで特定できた（例: 無印良品のキーマカレー）
--   '一般料理' = 具体的な料理として認識できたが商品特定はできない（例: 家庭のカレー）
--   '推定'    = 確信度が低く一般化した推定（既存データ・未指定時のデフォルト）
alter table public.meals
  add column brand text,
  add column recognition_type text not null default '推定'
    check (recognition_type in ('商品', '一般料理', '推定'));
