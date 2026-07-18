# 実装指示書 v2（Claude Sonnet向け）

**前提**: あなた（Sonnet）はこのリポジトリの実装担当です。着手前に必ず以下を読むこと。

1. `SPECIFICATION.md` — プロジェクト全体仕様（Single Source of Truth）
2. `docs/REVIEW-2026-07.md` — 本指示書の背景となる総点検レビュー
3. 本書 — 実装順序と受け入れ基準

**規律**（SPECIFICATION.md 17章と同じ）:
- mainへの直接push禁止。`feature/*` または `fix/*` ブランチ → PR → merge
- 1ブランチ = 1関心事。コミットはConventional Commits形式の日本語
- 各PRで `npm run lint` / `npx tsc --noEmit` / `npm run build` を通すこと
- DBスキーマ変更は必ず `supabase/migrations/` に連番SQLを追加（現在0005まで使用済み）。SupabaseへはSQL Editorでユーザーが手動適用する運用なので、**PR本文に適用すべきSQLを明記**すること
- 仕様変更を伴う場合はSPECIFICATION.mdの該当節を同一PRで更新

---

## Part A: 今すぐ実装する（この順番で）

### A-1. `fix/atomic-meal-writes` — 食事書き込みのアトミック化 ★★★★★

**課題**: `POST /api/meals` は meals INSERT → ingredients INSERT の2段階で、後段失敗時に孤児mealが残りリトライで二重登録される。PATCHは食材の全削除→再INSERTで途中失敗時にデータ消失。配列登録は逐次INSERTで部分保存が起きうる。

**実装**:
1. マイグレーション `0006_atomic_meal_functions.sql` を作成:
   - `register_meals(p_meals jsonb) returns uuid[]` — jsonb配列を受け取り、各要素について meals + ingredients を挿入して挿入IDの配列を返す。関数全体が1トランザクション。`security invoker`（RLSを通す）で定義し、`auth.uid()` を user_id に使う
   - `update_meal(p_id uuid, p_meal jsonb) returns uuid` — meals更新 + ingredients差し替えを1トランザクションで。対象行が無ければNULLを返す
   - anon からの EXECUTE は剥奪、authenticated には付与
2. `src/app/api/meals/route.ts` の POST を `supabase.rpc("register_meals", ...)` 呼び出しに置換。Zod検証は現状のままAPI側に残す（関数はDB整合性のみ担当）
3. `src/app/api/meals/[id]/route.ts` の PATCH を `update_meal` 呼び出しに置換
4. `src/types/database.ts` の `Functions` に2関数の型を追加

**受け入れ基準**:
- 単一・配列どちらの登録も従来どおり成功する
- ingredients挿入が失敗するケース（不正データを関数内で強制）で meals も残らないことをSQLで確認
- レスポンス形式（`{success, id, ids, count}`）は変更しない

### A-2. `fix/auth-guard-hardening` — 認証ガードの二重化 ★★★★★

**課題**: 認証が非推奨の `middleware.ts` に単独依存。ページは `user!.id` 非nullアサーション8箇所でミドルウェア成功を盲信しており、ミドルウェア不作動時に500になる。

**実装**:
1. `src/app/(main)/layout.tsx` をasync化し、`createClient().auth.getUser()` でユーザー取得。未認証なら `redirect("/login")`
2. 取得したuserを子へ渡すため `src/lib/supabase/require-user.ts` を新設（`getUser()`してnullなら`redirect("/login")`、非nullの`User`を返すヘルパー。ReactのcacheでラップしRSC内の重複呼び出しを1回に）
3. `(main)` 配下の全ページの `user!.id` を `requireUser()` 経由に置換（8箇所）
4. `middleware.ts` は**セッションリフレッシュ専用**として残す（リダイレクトロジックは残してよいが、コメントで「楽観的チェック。真の認可はレイアウト/APIで行う」と明記）
5. SPECIFICATION.md 9章に二重化の設計を追記

**受け入れ基準**: ミドルウェアのリダイレクトを一時的に無効化しても、未認証アクセスが500ではなく `/login` リダイレクトになること

### A-3. `chore/vitest-setup` — テスト導入 ★★★★★

**実装**:
1. `vitest` をdevDependenciesに追加、`npm test` スクリプト登録（`vitest run`）
2. テスト対象と最低ケース数:
   - `src/lib/validation/meal.ts` — **最重要**。本セッションで実際に踏んだ揺れを全て固定化する: v1最小JSON / brand+recognition_type付き / date+time分割 / 1桁時刻 / スペース区切り / スラッシュ日付 / date_time・eaten_atキー / 英語recognition_type / 未知recognition_typeのフォールバック / meal_type不正のエラー / 体重: アンダースコア無しキー / "-"未計測 / recorded_on補完3系統
   - `src/lib/utils/score.ts` — 満点帯・超過減点・不足減点・meal_count=0でnull・境界値
   - `src/lib/utils/targets.ts` — 計算式の期待値（BMR1852/96.05kg → 具体値をスナップショット）
   - `src/lib/utils/date.ts` — JST変換・翌日計算（月末・年末跨ぎ）
3. `.github/workflows/ci.yml` に `npm test` ステップを追加

**受け入れ基準**: 30ケース以上・CIで実行される・全て緑

### A-4. `feature/history-pagination` — 履歴の月ナビゲーション ★★★★★

**課題**: `meals/page.tsx` の `limit(100)` により約1ヶ月で過去が見えなくなる。

**実装**:
1. `/meals?month=YYYY-MM` を受け付け、指定月のみ取得（eaten_atの月範囲クエリ。limitは撤廃）。デフォルトは当月
2. 画面上部に前月/翌月ナビ（DashboardのDateNavと同じ見た目。カレンダーモーダルは不要、月送りのみ）
3. `GET /api/meals` にも `?month=` パラメータを追加（将来のクライアント取得用）
4. 月内0件時の空状態表示

**受け入れ基準**: 100件超のダミーデータ月でも全件表示・月送りで過去月が閲覧可能

### A-5. `feature/target-snapshot` — 目標値スナップショット ★★★★☆

**課題**: カレンダーのスコアが「現在の」目標値で全期間を再計算するため、目標変更で過去のスコアが変わる。

**実装**:
1. マイグレーション `0007_snapshot_targets.sql`: `daily_summaries` に `target_calorie_kcal / target_protein_g / target_fat_g / target_carbohydrate_g / target_salt_g`（nullable）を追加し、`refresh_daily_summary()` を更新して users から現在値をコピーするように
2. `GET /api/daily-summaries` のレスポンスの各summary行にスナップショット値を含める
3. `DateCalendar` のスコア計算を「行にスナップショットがあればそれを、なければ現在の目標値を」使うフォールバック方式に
4. `src/lib/utils/score.ts` は変更不要（引数に渡す値が変わるだけ）

**受け入れ基準**: 目標値を変更しても、変更前に記録済みの日のスコアが変わらない

### A-6. `chore/typegen-and-cleanup` — 型自動生成 + 小掃除 ★★★★☆

**実装**:
1. `package.json` に `"typegen": "supabase gen types typescript --project-id bprqepgckawdylaidjdh --schema public > src/types/database.ts"` を追加し、READMEに「スキーマ変更後は必ず実行」と記載（CLIログインが必要なのでCIには入れない）。生成型と現手書き型の差分でコードが壊れる場合はコードを直す
2. `src/lib/validation/meal.ts` を `meal.ts` / `weight.ts` に分割（re-exportで既存import互換を維持してもよい）
3. MealJsonImport / WeightJsonImport の共通ロジック（クリップボード貼付・デバウンス検証・エラー整形）を `src/lib/hooks/useJsonImport.ts` に抽出
4. `package.json` の name を `diet` に統一

### A-7. `feature/error-loading-ui` — エラー/ローディングUI + APIログ ★★★★☆

**実装**:
1. `src/app/(main)/error.tsx`（日本語メッセージ + 再試行ボタン、ダーク対応）と `global-error.tsx`
2. 主要ページに `loading.tsx`（カード型スケルトン）
3. 全APIルートのcatch/エラー分岐に `console.error("[api/meals]", error)` 形式のログを追加（Cloudflare Workersログで追跡可能に）

### A-8. `feature/api-token-auth` — APIキー認証 + 冪等性 ★★★★☆（Phase 5の前提）

SPECIFICATION.md 16.2の設計どおり実装する。

**実装**:
1. マイグレーション `0008_api_keys.sql`: `api_keys`（id / user_id / key_hash / name / last_used_at / created_at、RLS: 本人のみ）+ `meals.client_request_id text` 追加 + `(user_id, client_request_id)` のunique部分インデックス（NULL除外）
2. 認証解決を `src/lib/api/auth.ts` に集約: Cookieセッション → 失敗時 `Authorization: Bearer <key>` をSHA-256照合。既存APIの `getUser()` 呼び出しを置換
3. キー発行UI: Settings画面に「APIキー」セクション（発行時に平文を1回だけ表示・失効ボタン）
4. `POST /api/meals` / `POST /api/weight-logs` で `client_request_id`（bodyまたは`Idempotency-Key`ヘッダ）を受理。重複時は**既存レコードのIDを200で返す**（エラーにしない — ショートカットのリトライを成功として扱う）
5. SPECIFICATION.mdのショートカット設定手順を更新（Bearerヘッダ付きHTTPリクエストの設定例）

**受け入れ基準**: セッションなし + 有効キーで登録成功 / 無効キーで401 / 同一client_request_idの2回目が新規行を作らない

### A-9. `feature/json-v2` — JSON v2フィールド ★★★★☆

`docs/REVIEW-2026-07.md` ⑥の仕様どおり。

**実装**:
1. マイグレーション `0009_meal_v2_fields.sql`: `meals` に `portion_ratio numeric(3,2) default 1.0` / `people_count integer default 1` / `store text` / `memo text` / `meal_group_id uuid` + `meals(meal_group_id)` インデックス
2. Zodスキーマに追加（全てoptional・デフォルトはv1互換値）。`schema_version` は受理して `raw_json` に残すのみ（分岐には使わない）
3. **栄養値の扱い**: mealsテーブルには換算後（皿全体 × portion_ratio ÷ people_count）を保存する。換算はAPI側で行い、皿全体の値はraw_jsonに残る。daily_summariesトリガーは変更不要
4. 配列POST時に1つの `meal_group_id` を採番して全要素に付与
5. Meal Detailに store / memo / portion情報を表示、編集フォームにmemo・portion_ratio・people_count追加
6. SPECIFICATION.md 7章・17.8プロンプトをv2に更新（プロンプトには portion_ratio / people_count / store の指示を追記）

---

## Part B: 設計のみ（今は実装しない）

実装を始める前に必ずユーザーの承認を取ること。設計の詳細は `docs/REVIEW-2026-07.md` の各節を正とする。

| 項目 | 設計の要点 | 実装トリガー |
|---|---|---|
| **Phase 4: AIコーチ** | `coach_comments` テーブル + 日1回のバッチ（Cloudflare Cron Triggers → 直近14日のdaily_summariesをClaude APIへ）+ Dashboardカード。LLMキーはWorkersのSecret | ユーザーがPhase 4開始を指示したら |
| **写真保存** | Supabase Storage バケット `meal-photos`（RLS: 本人のみ）。オリジナル + 幅800pxサムネイル。`meals.photo_url` に格納。1GB超過見込みでR2へ移行検討 | Phase 5完了後 |
| **Apple ヘルスケア連携** | ネイティブアプリ不要。iOSショートカット「ヘルスケアサンプルを検索」で体重を読み → 既存 `/api/weight-logs` へPOST。逆方向は「ヘルスケアサンプルを記録」で食事カロリーを書き込み。アプリ側の新規実装はほぼゼロ（手順書のみ） | A-8完了後いつでも |
| **products / バーコード** | `products`（jan_code unique / brand / name / 栄養成分）。登録フローでrecognition_type=商品 && brand一致時に照合し、ヒットすれば栄養値を商品データで上書き + `meals.product_id` 記録。バーコードはWeb標準 `BarcodeDetector`（iOS Safari 17+）でJAN読取→products検索→なければChatGPT解析へフォールバック | 6ヶ月ロードマップ |
| **レシートOCR / 食費** | `purchases` テーブル（食事と分離）。レシート写真 → ChatGPT Vision → 購入品配列JSON → 既存JSON Import基盤の流用で貼付登録。店舗名・金額・日付 | 1年ロードマップ |
| **通知 / 週間レポート** | PWA Web Push（iOSはホーム画面追加PWAで可）。週次Cron → AIコーチ拡張で生成 → Push。`push_subscriptions` テーブル | Phase 4安定後 |

---

## 実装順序まとめ

```
A-1 → A-2 → A-3 →（ここまでで「壊れない基盤」完成）
A-4 → A-5 → A-6 → A-7 →（品質・スケール対応完了）
A-8 → A-9 →（Phase 5 自動連携の前提完了）
→ Part B へ（各項目ユーザー承認後）
```

各ブランチ完了ごとにPRを作成し、マージ後に次へ進むこと。
