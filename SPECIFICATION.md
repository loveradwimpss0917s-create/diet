# AI食事記録 Webアプリ 完全開発仕様書

**バージョン**: 1.0.0
**作成日**: 2026-07-12
**対象実装者**: Claude Sonnet（AI実装エージェント）
**リポジトリ**: `loveradwimpss0917s-create/diet`

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [システム全体アーキテクチャ](#2-システム全体アーキテクチャ)
3. [技術スタックと選定理由](#3-技術スタックと選定理由)
4. [ディレクトリ構成](#4-ディレクトリ構成)
5. [データベース設計](#5-データベース設計)
6. [API設計](#6-api設計)
7. [JSONスキーマとバリデーション仕様](#7-jsonスキーマとバリデーション仕様)
8. [画面設計](#8-画面設計)
9. [認証設計](#9-認証設計)
10. [PWA対応](#10-pwa対応)
11. [Git運用ルール](#11-git運用ルール)
12. [Cloudflareデプロイ設定](#12-cloudflareデプロイ設定)
13. [環境変数](#13-環境変数)
14. [Supabaseセットアップ手順](#14-supabaseセットアップ手順)
15. [開発フェーズ](#15-開発フェーズ)
16. [将来機能の設計指針](#16-将来機能の設計指針)
17. [Sonnet向け実装指示書](#17-sonnet向け実装指示書)

---

## 1. プロジェクト概要

### 1.1 アプリ名

**AI食事記録**

### 1.2 目的

iPhoneで食事写真を撮影し、ChatGPT Visionで料理と栄養素を解析。そのデータを保存し、ユーザーの食事管理・栄養分析・AI食事コーチングを行うWebアプリを提供する。

### 1.3 最終目標

> 「写真を撮るだけで、自動的に食事記録・栄養管理が完成するAI食事管理サービス」

### 1.4 現在完成している部分（アプリ外）

iOSショートカットで以下のフローが構築済み:

```
写真撮影
  ↓
ChatGPTへ画像送信
  ↓
食事解析
  ↓
JSON形式で栄養データ取得
```

本アプリは、このJSONを受け取って管理する側を担う。

### 1.5 入力方式のロードマップ

| フェーズ | 入力方式 | ユーザー操作 |
|---|---|---|
| Phase 1（MVP） | ChatGPTのJSONをコピーし、Webアプリの JSON Import 画面へ貼り付け | 撮影 → コピー → 貼付 → 登録 |
| Phase 5（最終形） | iOSショートカットが `POST /api/meals` へ直接送信 | **撮影のみ** |

**重要**: 手動貼付（Phase 1）とショートカット自動送信（Phase 5）は、**同一のAPI `POST /api/meals` を利用する**。JSON Import画面は内部でこのAPIを呼ぶこと。入り口が違うだけで処理は完全に共通化する。

---

## 2. システム全体アーキテクチャ

```
┌──────────────────────────────────────────────────────────┐
│  iPhone                                                   │
│  ┌──────────┐   ┌──────────────┐                          │
│  │ カメラ    │ → │ ChatGPT Vision│ → 栄養JSON              │
│  └──────────┘   └──────────────┘        │                 │
│                              Phase1: コピー│ Phase5: ショートカットが直接POST
└──────────────────────────────┬───────────┴────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────┐
│  AI食事記録 Webアプリ（Cloudflare Workers 上で稼働）        │
│                                                           │
│  Next.js (App Router)                                     │
│  ├─ UI: JSON Import / Dashboard / History / Detail /      │
│  │      Weight / Settings                                 │
│  └─ API Routes                                            │
│       └─ POST /api/meals ←──── 手動貼付 & 自動送信の共通入口 │
│                               ↓                           │
│                    ┌─────────────────────┐                │
│                    │ Supabase             │                │
│                    │ ├─ PostgreSQL (DB)   │                │
│                    │ └─ Auth (認証)       │                │
│                    └─────────────────────┘                │
└──────────────────────────────────────────────────────────┘
         ↑ 自動デプロイ
┌────────────────────┐
│ GitHub (main merge) │ → Build → Test → Cloudflare Deploy
└────────────────────┘
```

---

## 3. 技術スタックと選定理由

| レイヤー | 技術 | バージョン方針 | 選定理由 |
|---|---|---|---|
| Frontend | **Next.js**（App Router） | 最新安定版（`create-next-app@latest`） | React標準、API Routes同居、Cloudflare対応 |
| 言語 | **TypeScript** | Next.js同梱の最新 | 型安全。JSONスキーマ検証と相性が良い |
| CSS | **Tailwind CSS** | v4系（create-next-appの選択肢に従う） | スマホファーストのユーティリティ設計が高速 |
| バリデーション | **Zod** | 最新 | 栄養JSONの実行時検証＋TypeScript型の単一ソース化 |
| Chart | **Recharts** | 最新 | React親和性が高く、PFC・体重グラフに十分 |
| DB | **Supabase PostgreSQL** | — | RLSでマルチユーザー安全、無料枠でMVP可 |
| 認証 | **Supabase Auth** | `@supabase/ssr` を使用 | DBと統合、Cookie ベースのSSR認証が可能 |
| Hosting | **Cloudflare Workers**（`@opennextjs/cloudflare`） | 最新 | 後述 3.1 参照 |
| PWA | Web App Manifest + Service Worker | — | ホーム画面追加でネイティブ風UX |
| CI | GitHub Actions | — | PR時の lint / typecheck / build 検証 |
| Version管理 | GitHub | — | Cloudflare自動デプロイと連携 |

### 3.1 Cloudflareホスティングの選定（重要）

要件は「Cloudflare Pages または Cloudflare Workers」だが、**Cloudflare Workers + `@opennextjs/cloudflare` アダプタを採用する**。

理由:

- Cloudflare公式が、Next.jsの新規プロジェクトには Workers + OpenNext アダプタを推奨している（Pages向け `@cloudflare/next-on-pages` はメンテナンスモード）。
- OpenNextアダプタは Node.js ランタイム互換で動作するため、`@supabase/ssr` などのライブラリ制約が少ない。
- Workers Builds（GitHub連携）で「mainへmerge → 自動ビルド → 自動デプロイ」が実現できる（Pagesと同等のGit連携体験）。

セットアップ詳細は [12章](#12-cloudflareデプロイ設定) を参照。

### 3.2 採用しないもの（スコープ外）

- 状態管理ライブラリ（Redux等）: サーバーコンポーネント＋fetchで十分。必要になったらSWR/TanStack Queryを検討。
- ORM（Prisma等）: Supabase JSクライアント（`supabase-js`）で直接操作する。マイグレーションはSQLファイルで管理。
- 画像アップロード: Phase 1〜4ではスコープ外（写真はChatGPT側で処理済み）。将来Supabase Storageで対応。

---

## 4. ディレクトリ構成

```
diet/
├── .github/
│   └── workflows/
│       └── ci.yml                 # PR時: lint + typecheck + build
├── docs/
│   └── (本仕様書・追加設計メモ)
├── public/
│   ├── manifest.webmanifest       # PWA manifest
│   └── icons/                     # PWAアイコン (192/512px)
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql          # 全テーブル + RLS
│       └── (以降の変更は連番SQL)
├── src/
│   ├── app/
│   │   ├── layout.tsx             # ルートレイアウト（ボトムナビ含む）
│   │   ├── page.tsx               # → /dashboard へredirect
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (main)/                # 認証必須グループ
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── import/page.tsx    # JSON Import画面
│   │   │   ├── meals/
│   │   │   │   ├── page.tsx       # Meal History
│   │   │   │   └── [id]/page.tsx  # Meal Detail
│   │   │   ├── weight/page.tsx    # Weight Management
│   │   │   └── settings/page.tsx
│   │   ├── auth/
│   │   │   └── callback/route.ts  # Supabase Auth コールバック
│   │   └── api/
│   │       ├── meals/
│   │       │   ├── route.ts       # POST(登録) / GET(一覧)
│   │       │   └── [id]/route.ts  # GET / DELETE
│   │       └── weight-logs/
│   │           └── route.ts       # POST / GET
│   ├── components/
│   │   ├── ui/                    # 汎用UI（Button, Card, ProgressBar…）
│   │   ├── meals/                 # MealCard, NutritionTable, JsonPreview…
│   │   └── charts/                # PfcBar, WeightChart（Recharts）
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # ブラウザ用クライアント
│   │   │   ├── server.ts          # Server Component / Route Handler用
│   │   │   └── middleware.ts      # セッション更新ヘルパ
│   │   ├── validation/
│   │   │   └── meal.ts            # Zodスキーマ（7章）
│   │   └── utils/
│   │       └── date.ts            # JST日付処理
│   ├── types/
│   │   └── database.ts            # Supabase生成型
│   └── middleware.ts              # 認証ガード（Cloudflare/OpenNextがNode.jsランタイムのProxy未対応のため旧規約を使用）
├── .env.example                   # 環境変数の雛形（値なし）
├── .gitignore
├── next.config.ts
├── open-next.config.ts            # OpenNext Cloudflare設定
├── wrangler.jsonc                 # Cloudflare Workers設定
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. データベース設計

### 5.1 設計方針

- 全テーブルに **Row Level Security (RLS)** を適用し、`user_id = auth.uid()` の行のみ操作可能にする。
- `users` テーブルは Supabase Auth の `auth.users` を参照する **プロフィールテーブル**（`public.users`）として実装する。
- 主キーは全て `uuid`（`gen_random_uuid()`）。
- タイムゾーン: DB保存は `timestamptz`（UTC内部表現）。表示・日付集計はJST（`Asia/Tokyo`）でアプリ側処理。
- `ingredients` は正規化テーブルとして持つが、Phase 1の書き込みは `meals` 登録時に同一トランザクション相当（API内）で行う。

### 5.2 ER図

```
auth.users (Supabase管理)
    │ 1:1
    ▼
public.users ──────────────┬──────────────┬──────────────┐
    │ 1:N                  │ 1:N          │ 1:N          │ 1:N
    ▼                      ▼              ▼              ▼
public.meals          public.weight_logs  public.daily_summaries
    │ 1:N
    ▼
public.ingredients
```

### 5.3 users（プロフィール）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| `id` | `uuid` | **PK**, `references auth.users(id) on delete cascade` | Auth ユーザーIDと同一 |
| `display_name` | `text` | | 表示名 |
| `target_calorie_kcal` | `integer` | `default 2000` | 目標カロリー |
| `target_protein_g` | `numeric(6,1)` | `default 60` | 目標タンパク質 |
| `target_fat_g` | `numeric(6,1)` | `default 60` | 目標脂質 |
| `target_carbohydrate_g` | `numeric(6,1)` | `default 300` | 目標炭水化物 |
| `target_salt_g` | `numeric(4,1)` | `default 7.5` | 目標塩分 |
| `target_weight_kg` | `numeric(5,2)` | nullable | 目標体重 |
| `created_at` | `timestamptz` | `default now()` | |
| `updated_at` | `timestamptz` | `default now()` | |

- サインアップ時に `auth.users` へのINSERTをトリガーに自動作成する（`handle_new_user()` トリガー関数）。

### 5.4 meals（食事記録・中核テーブル）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| `id` | `uuid` | **PK**, `default gen_random_uuid()` | |
| `user_id` | `uuid` | **FK** → `users(id) on delete cascade`, `not null` | |
| `eaten_at` | `timestamptz` | `not null` | JSONの `datetime`。食事日時 |
| `meal_type` | `text` | `not null`, `check (meal_type in ('朝食','昼食','夕食','間食'))` | |
| `meal_timing` | `text` | `check (meal_timing in ('朝','昼','夜','深夜'))`, nullable | |
| `menu_name` | `text` | `not null` | 料理名 |
| `category` | `text` | | 例: 和菓子 |
| `serving_size` | `text` | | 例: 1個 |
| `calorie_kcal` | `numeric(7,1)` | `not null`, `check (calorie_kcal >= 0)` | |
| `protein_g` | `numeric(6,1)` | `not null default 0`, `check (>= 0)` | |
| `fat_g` | `numeric(6,1)` | `not null default 0`, `check (>= 0)` | |
| `carbohydrate_g` | `numeric(6,1)` | `not null default 0`, `check (>= 0)` | |
| `fiber_g` | `numeric(6,1)` | `default 0` | |
| `salt_g` | `numeric(5,2)` | `default 0` | |
| `confidence` | `integer` | `check (confidence between 0 and 100)` | AI解析信頼度 |
| `evaluation` | `text` | | AI評価 |
| `advice` | `text` | | AIアドバイス |
| `photo_url` | `text` | nullable | 将来の写真連携用（Phase 1では未使用） |
| `raw_json` | `jsonb` | `not null` | 受信JSON原文。将来のスキーマ変更・再解析に備え必ず保存 |
| `created_at` | `timestamptz` | `default now()` | |
| `updated_at` | `timestamptz` | `default now()` | |

**Index**:

```sql
create index meals_user_eaten_idx on public.meals (user_id, eaten_at desc);
create index meals_user_type_idx  on public.meals (user_id, meal_type);
```

> 注: JSONのキー `datetime` はSQL予約語に近く紛らわしいため、カラム名は `eaten_at` とする。API層でマッピングする。

### 5.5 ingredients（食材・正規化）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| `id` | `uuid` | **PK**, `default gen_random_uuid()` | |
| `meal_id` | `uuid` | **FK** → `meals(id) on delete cascade`, `not null` | |
| `user_id` | `uuid` | **FK** → `users(id) on delete cascade`, `not null` | RLS簡略化のため非正規化して持つ |
| `name` | `text` | `not null` | 食材名 |
| `position` | `integer` | `not null default 0` | 表示順 |
| `created_at` | `timestamptz` | `default now()` | |

**Index**:

```sql
create index ingredients_meal_idx on public.ingredients (meal_id);
create index ingredients_user_name_idx on public.ingredients (user_id, name);
```

- `user_name` インデックスは将来のAIコーチ（「魚料理が少ない」等の食材傾向分析）で使用。

### 5.6 weight_logs（体重記録）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| `id` | `uuid` | **PK**, `default gen_random_uuid()` | |
| `user_id` | `uuid` | **FK** → `users(id) on delete cascade`, `not null` | |
| `recorded_on` | `date` | `not null` | 記録日（JST基準の日付） |
| `weight_kg` | `numeric(5,2)` | `not null`, `check (weight_kg > 0)` | |
| `body_fat_percent` | `numeric(4,1)` | nullable, `check (between 0 and 100)` | 体脂肪率 |
| `muscle_mass_kg` | `numeric(5,2)` | nullable | 筋肉量（体組成計JSON貼付用） |
| `bmi` | `numeric(4,1)` | nullable | BMI |
| `visceral_fat_level` | `numeric(4,1)` | nullable | 内臓脂肪レベル |
| `basal_metabolism_kcal` | `integer` | nullable | 基礎代謝量 |
| `body_age` | `integer` | nullable | 体内年齢 |
| `bone_mass_kg` | `numeric(4,2)` | nullable | 推定骨量 |
| `muscle_quality_score` | `numeric(5,1)` | nullable | 筋質点数 |
| `body_water_percent` | `numeric(4,1)` | nullable | 体水分率 |
| `raw_json` | `jsonb` | nullable | JSON貼付時の原文（手動入力時はnull） |
| `note` | `text` | | メモ |
| `created_at` | `timestamptz` | `default now()` | |

**制約・Index**:

```sql
alter table public.weight_logs
  add constraint weight_logs_user_date_uniq unique (user_id, recorded_on);
create index weight_logs_user_date_idx on public.weight_logs (user_id, recorded_on desc);
```

- 同日2回目の入力は **UPSERT**（上書き）とする。

### 5.7 daily_summaries（日次集計キャッシュ）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| `id` | `uuid` | **PK**, `default gen_random_uuid()` | |
| `user_id` | `uuid` | **FK** → `users(id) on delete cascade`, `not null` | |
| `summary_date` | `date` | `not null` | JST基準の日付 |
| `total_calorie_kcal` | `numeric(8,1)` | `not null default 0` | |
| `total_protein_g` | `numeric(7,1)` | `not null default 0` | |
| `total_fat_g` | `numeric(7,1)` | `not null default 0` | |
| `total_carbohydrate_g` | `numeric(7,1)` | `not null default 0` | |
| `total_fiber_g` | `numeric(7,1)` | `not null default 0` | |
| `total_salt_g` | `numeric(6,2)` | `not null default 0` | |
| `meal_count` | `integer` | `not null default 0` | |
| `updated_at` | `timestamptz` | `default now()` | |

**制約・Index**:

```sql
alter table public.daily_summaries
  add constraint daily_summaries_user_date_uniq unique (user_id, summary_date);
create index daily_summaries_user_date_idx on public.daily_summaries (user_id, summary_date desc);
```

**更新方式**: `meals` の INSERT / UPDATE / DELETE をDBトリガーで捕捉し、該当日のサマリーを再計算する（アプリ側での二重管理を避ける）。日付変換は `(eaten_at at time zone 'Asia/Tokyo')::date` を使用。

> Phase 1〜2の規模ではオンザフライ集計でも性能上問題ないが、AIコーチ（Phase 4）が期間分析で多用するため初期から用意する。

### 5.8 RLSポリシー（全テーブル共通パターン)

```sql
alter table public.meals enable row level security;

create policy "own rows select" on public.meals
  for select using (auth.uid() = user_id);
create policy "own rows insert" on public.meals
  for insert with check (auth.uid() = user_id);
create policy "own rows update" on public.meals
  for update using (auth.uid() = user_id);
create policy "own rows delete" on public.meals
  for delete using (auth.uid() = user_id);
```

同パターンを `users`（idベース）、`ingredients`、`weight_logs`、`daily_summaries` に適用する。

---

## 6. API設計

### 6.1 共通仕様

- ベース: Next.js Route Handlers（`src/app/api/`）
- 認証: Supabaseセッション（Cookie）。未認証は `401`。
  - Phase 5でショートカット連携用に **APIキー認証（Bearerトークン）** を追加予定（16.2参照）。設計上、認証解決部を関数として分離しておくこと。
- Content-Type: `application/json`
- エラーレスポンス統一形式:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "calorie_kcal は 0 以上の数値である必要があります",
    "details": [ { "path": "calorie_kcal", "message": "..." } ]
  }
}
```

| code | HTTP | 意味 |
|---|---|---|
| `UNAUTHORIZED` | 401 | 未ログイン |
| `VALIDATION_ERROR` | 400 | JSONスキーマ違反 |
| `INVALID_JSON` | 400 | JSONとしてパース不能 |
| `NOT_FOUND` | 404 | 対象なし（他人の行も404で隠蔽） |
| `INTERNAL_ERROR` | 500 | サーバ内部エラー |

### 6.2 `POST /api/meals` — 食事登録（最重要API）

**手動（JSON Import画面）と自動（iOSショートカット）の共通入口。**

**Request Body**: ChatGPT出力JSON（7章のスキーマ）そのまま。

```json
{
  "datetime": "2026-07-12T21:56:00+09:00",
  "meal_type": "間食",
  "meal_timing": "夜",
  "menu_name": "雪塩ちんすこう ミルク風味",
  "category": "和菓子",
  "ingredients": ["小麦粉", "砂糖", "ラード", "塩", "ミルクパウダー"],
  "serving_size": "1個",
  "calorie_kcal": 120,
  "protein_g": 1,
  "fat_g": 6,
  "carbohydrate_g": 16,
  "fiber_g": 0,
  "salt_g": 0.2,
  "confidence": 90,
  "evaluation": "糖質と脂質が多めです",
  "advice": "間食としては適量ですが、タンパク質や食物繊維を補うと良いです"
}
```

**処理フロー**:

1. 認証解決（セッション → `user_id`）
2. `request.json()` パース（失敗 → `INVALID_JSON`）
3. Zodスキーマ検証（失敗 → `VALIDATION_ERROR` + details）
4. `meals` へINSERT（`raw_json` に原文格納）
5. `ingredients` へ配列を一括INSERT（`position` は配列順）
6. `daily_summaries` はDBトリガーが自動更新
7. レスポンス返却

**Response** `201 Created`:

```json
{ "success": true, "id": "xxxx-uuid" }
```

### 6.3 `GET /api/meals` — 一覧取得

| Query | 型 | 説明 |
|---|---|---|
| `date` | `YYYY-MM-DD` | 指定日（JST）の食事のみ |
| `from` / `to` | `YYYY-MM-DD` | 期間指定 |
| `limit` | number | default 50, max 100 |
| `offset` | number | ページング |

**Response** `200`: `{ "success": true, "meals": [ ...ingredients込みのmealオブジェクト ], "total": 12 }`

### 6.4 `GET /api/meals/[id]` — 詳細取得

`ingredients` を含めて返す。他ユーザーの行は `404`。

### 6.5 `DELETE /api/meals/[id]` — 削除

誤登録の取り消し用。`ingredients` はcascade削除、サマリーはトリガーで再計算。
**Response**: `{ "success": true }`

### 6.6 `POST /api/weight-logs` — 体重登録

```json
{ "recorded_on": "2026-07-12", "weight_kg": 62.5, "body_fat_percent": 18.2, "note": "" }
```

`(user_id, recorded_on)` でUPSERT。**Response**: `{ "success": true, "id": "xxxx" }`

### 6.7 `GET /api/weight-logs` — 体重一覧

`from` / `to` クエリ対応。グラフ描画用に `recorded_on` 昇順で返す。

---

## 7. JSONスキーマとバリデーション仕様

`src/lib/validation/meal.ts` に **Zod** で定義する。この定義がAPI・Import画面プレビューの唯一の検証ソースとなる。

```ts
import { z } from "zod";

export const mealJsonSchema = z.object({
  datetime: z.string().datetime({ offset: true }),          // ISO8601（オフセット必須）
  meal_type: z.enum(["朝食", "昼食", "夕食", "間食"]),
  meal_timing: z.enum(["朝", "昼", "夜", "深夜"]).optional(),
  menu_name: z.string().min(1).max(200),
  category: z.string().max(100).optional().default(""),
  ingredients: z.array(z.string().min(1).max(100)).max(50).default([]),
  serving_size: z.string().max(50).optional().default(""),
  calorie_kcal: z.number().min(0).max(10000),
  protein_g: z.number().min(0).max(1000).default(0),
  fat_g: z.number().min(0).max(1000).default(0),
  carbohydrate_g: z.number().min(0).max(1000).default(0),
  fiber_g: z.number().min(0).max(500).default(0),
  salt_g: z.number().min(0).max(100).default(0),
  confidence: z.number().int().min(0).max(100).optional(),
  evaluation: z.string().max(1000).optional().default(""),
  advice: z.string().max(2000).optional().default(""),
});

export type MealJson = z.infer<typeof mealJsonSchema>;
```

**寛容性ルール**（ChatGPT出力は揺れるため）:

- 数値フィールドが文字列 `"120"` で来た場合は `z.coerce.number()` 相当で受容する。
- 未知のキーは**エラーにせず無視**する（`strict()` を使わない）。ただし `raw_json` には原文をそのまま保存。
- `datetime` にオフセットが無い場合はJST（`+09:00`）とみなして補完する前処理を入れる。
- `meal_type` の揺れ（例: 「朝ごはん」）はPhase 1では**エラーとして返し**、Import画面でユーザーに修正を促す。マッピング辞書での自動補正はPhase 5で検討。

---

## 8. 画面設計

### 8.1 共通UI方針

- **スマホファースト**（375px基準でデザインし、タブレット以上は中央寄せ `max-w-md` 〜 `max-w-2xl`）
- 下部固定の**ボトムナビゲーション**（5タブ）:
  `ホーム(Dashboard)` / `履歴(History)` / `＋登録(Import)` / `体重(Weight)` / `設定(Settings)`
  中央の「＋登録」は強調（円形FAB風）。
- カラー: ニュートラル基調 + アクセント1色（emerald系）。P/F/Cは固定色（P=青系、F=黄系、C=赤系）で全画面統一。
- ローディング・空状態・エラー状態を全画面で必ず実装する。

### 8.2 JSON Import 画面（`/import`）— Phase 1の中核

| 要素 | 仕様 |
|---|---|
| JSON入力欄 | `<textarea>` 大きめ（10行以上）。等幅フォント。プレースホルダに例JSONを薄く表示 |
| 貼付ボタン | `navigator.clipboard.readText()` でワンタップ貼付（権限エラー時は手動貼付を案内） |
| 解析 | 入力変化時に自動でパース＋Zod検証（デバウンス300ms）。「解析」ボタンも併設 |
| バリデーション表示 | エラー時: フィールド単位のエラーリストを赤枠で表示。登録ボタン無効化 |
| プレビュー | 検証成功時にカード表示（下記） |
| 登録ボタン | プレビュー確認後にタップ → `POST /api/meals` → 成功トースト → 入力欄クリア → 「履歴を見る」導線 |

**プレビューカードの表示項目**（仕様指定）:

- 料理名（menu_name）
- カテゴリ（category）
- 食事日時・食事区分
- カロリー（大きく表示）
- **PFC**（P/F/C数値 + ミニバー）＋食物繊維・塩分
- AI評価（evaluation）
- AIアドバイス（advice）
- 信頼度（confidence をバッジ表示。80未満は注意色）

### 8.3 Dashboard（`/dashboard`）

**今日（JST）の摂取量サマリー**:

| 表示 | 内容 |
|---|---|
| カロリー | `摂取kcal / 目標kcal` + プログレスバー |
| P / F / C | それぞれ `摂取g / 目標g` + プログレスバー（3本） |
| 塩分 | `摂取g / 目標g` + プログレスバー |
| 目標との差 | 残り○○kcal（超過時は赤字で「+○○kcal超過」） |
| 今日の食事 | 当日のミールカード一覧（時刻順）。0件なら「＋登録」への導線 |

- プログレスバーは100%超過で色を警告色に変える。
- データソース: `daily_summaries`（当日行）+ 当日の `meals`。

### 8.4 Meal History（`/meals`）

- **日付別グルーピング一覧**（新しい日付が上）。日付ヘッダに日合計kcalを併記。
- 各行（MealCard）: 写真サムネイル（`photo_url` 無しの間はカテゴリアイコンで代替）/ 時刻・食事区分 / 料理名 / kcal・PFC / AI評価（1行省略）
- 日付ピッカー or 前日・翌日ナビ。無限スクロールまたは「もっと見る」。
- タップで Meal Detail へ。

### 8.5 Meal Detail（`/meals/[id]`)

- 全栄養素テーブル（kcal / P / F / C / 食物繊維 / 塩分）
- 食材リスト（ingredients）
- serving_size、confidence
- AI評価・AIアドバイス（全文）
- 削除ボタン（確認ダイアログ → `DELETE /api/meals/[id]`）

### 8.6 Weight Management（`/weight`）

- 入力フォーム: 体重（必須・小数1〜2桁）/ 体脂肪率（任意）/ メモ（任意）/ 日付（デフォルト今日）
- 同日再入力は上書き（UPSERT）である旨を表示
- **グラフ（Recharts LineChart）**: 体重推移＋体脂肪率（第2軸）。期間切替タブ: `1週間 / 1ヶ月 / 3ヶ月 / 全期間`
- 目標体重（users.target_weight_kg）があれば水平参照線を表示

### 8.7 Settings（`/settings`）

- プロフィール: 表示名
- 目標値編集: カロリー / P / F / C / 塩分 / 目標体重
- アカウント: ログアウト
- （Phase 5用の枠だけ用意）APIキー管理セクション — 「準備中」表示

### 8.8 認証画面（`/login`, `/signup`）

- メール＋パスワード（Supabase Auth）
- 最小限のフォーム。エラーメッセージは日本語で表示。

---

## 9. 認証設計

- `@supabase/ssr` を使用し、Cookieベースのセッション管理を行う。
- `src/middleware.ts` で `(main)` グループと `/api/*` を保護。未認証のページアクセスは `/login` へリダイレクト、APIは `401` を返す。
  - 注: Next.js 16では`middleware.ts`は`proxy.ts`に改称され非推奨警告が出るが、`proxy.ts`は常にNode.jsランタイムでコンパイルされ、Cloudflare（`@opennextjs/cloudflare`）が現状Node.jsランタイムのミドルウェアを未サポートのため、Edgeランタイムでコンパイルされる旧`middleware.ts`規約を意図的に使用している。
- `auth.users` INSERT時のトリガーで `public.users` に行を自動作成（デフォルト目標値入り）。
- メール確認: MVPでは**無効**（Supabase設定で確認メールをオフ）にし、フリクションを下げる。本番運用時に有効化を検討。

---

## 10. PWA対応

- `public/manifest.webmanifest`:
  - `name: "AI食事記録"`, `short_name: "食事記録"`, `display: "standalone"`, `theme_color`, `background_color`, アイコン192/512px
- `layout.tsx` でmanifestリンクと `apple-mobile-web-app-capable` 等のiOS向けmetaを設定
- Service Worker: MVPでは**最小構成**（インストール可能要件を満たすのみ。オフラインキャッシュ戦略はPhase 3以降）
- iPhoneの「ホーム画面に追加」で全画面起動できることを受け入れ基準とする

---

## 11. Git運用ルール

### 11.1 ブランチ戦略

```
main（保護ブランチ・直接push禁止）
 └── feature/xxx で開発 → PR → レビュー → squash merge → Cloudflare自動デプロイ
```

| ブランチ | 用途 | 命名例 |
|---|---|---|
| `main` | 常にデプロイ可能な状態 | — |
| `feature/*` | 機能開発 | `feature/json-import` |
| `fix/*` | バグ修正 | `fix/import-validation` |
| `chore/*` | 設定・依存・CI | `chore/setup-ci` |

### 11.2 mainブランチ保護（GitHub設定・手動）

リポジトリの Settings → Branches → Branch protection rules で `main` に対して:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass（CI: `lint-typecheck-build`）
- ✅ Do not allow bypassing the above settings

> 注: この設定はGitHub UI上の操作なので、実装エージェントはREADMEに手順を記載し、ユーザーに設定を依頼すること。

### 11.3 コミットメッセージ規則（Conventional Commits）

形式: `<type>(<scope>): <日本語の要約>`

| type | 用途 |
|---|---|
| `feat` | 機能追加 |
| `fix` | バグ修正 |
| `chore` | 環境・依存・設定 |
| `docs` | ドキュメント |
| `refactor` | 動作を変えない整理 |
| `test` | テスト |
| `style` | フォーマットのみ |

例:

```
feat(import): JSON Import画面の貼付・検証・プレビューを実装
fix(api): datetimeオフセット欠落時にJSTを補完
chore(deploy): OpenNext Cloudflare設定を追加
```

ルール:

- 1コミット1関心事。動くたびに小さくコミット。
- 要約は50文字目安。必要なら本文に背景・影響範囲を記載。

### 11.4 Pull Requestルール

- タイトル: コミット規則と同形式
- 本文テンプレート（`.github/pull_request_template.md` を作成すること）:

```markdown
## 概要
<!-- 何を・なぜ -->

## 変更内容
- [ ] ...

## 確認方法
<!-- 動作確認手順 -->

## スクリーンショット
<!-- UI変更時 -->
```

- マージ方式: **Squash and merge** 推奨（mainの履歴を1PR=1コミットに保つ）

### 11.5 CI（GitHub Actions）

`.github/workflows/ci.yml` — PRおよびmain pushで実行:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  lint-typecheck-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ vars.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co' }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ vars.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder' }}
```

---

## 12. Cloudflareデプロイ設定

### 12.1 構成

**Cloudflare Workers + Workers Builds（GitHub連携）+ `@opennextjs/cloudflare`**

フロー:

```
GitHub main へ merge
  ↓ （Workers Builds が webhook で検知）
Build（npm ci → opennextjs-cloudflare build）
  ↓
Deploy（opennextjs-cloudflare deploy）
  ↓
本番URL反映（*.workers.dev または独自ドメイン）
```

PRブランチには **Preview URL** が自動発行される（Workers Buildsのnon-productionブランチビルド）。

### 12.2 リポジトリ側の設定ファイル

`wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "diet",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-07-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  }
}
```

`open-next.config.ts`:

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
export default defineCloudflareConfig();
```

`package.json` scripts（追加分）:

```json
{
  "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
  "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
}
```

依存: `npm i -D wrangler @opennextjs/cloudflare`

### 12.3 Cloudflareダッシュボード設定手順（READMEに記載する内容）

1. Cloudflareダッシュボード → **Workers & Pages** → **Create** → **Workers** → **Connect to Git**
2. GitHubアカウント連携 → リポジトリ `diet` を選択
3. ビルド設定:
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
   - Production branch: `main`
4. **環境変数**（Variables and Secrets）に以下を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. 保存 → 初回ビルドが走る → `https://diet.<account>.workers.dev` で稼働確認

> Supabase の anon key は RLS 前提の公開可能キーだが、慣習として Secret 扱いにしてよい。
> Cloudflare側のWorker名は `wrangler.jsonc` の `name`（`diet`）と完全一致させること。不一致だとビルドが失敗する。

### 12.4 デプロイ検証チェックリスト

- [ ] mainへのmergeで自動ビルド・デプロイが走る
- [ ] PRでPreview URLが発行される
- [ ] 本番URLでログイン → JSON Import → Dashboard反映まで通しで動く
- [ ] APIルート（`POST /api/meals`）がWorker上で動作する（Node互換モードの確認）

---

## 13. 環境変数

`.env.example`（値は空で必ずコミット）:

```bash
# Supabase — プロジェクト設定 > API から取得
NEXT_PUBLIC_SUPABASE_URL=        # 例: https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # anon (public) key。RLS前提でブラウザ公開可
```

| 変数 | 公開区分 | 用途 | 設定場所 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 公開可 | supabase-js接続先 | `.env.local` / Cloudflare / GitHub Actions vars |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公開可（RLS必須） | supabase-js認証 | 同上 |

**ルール**:

- `.env.local` は `.gitignore` 対象。**実値は絶対にコミットしない**。
- `service_role` キーはPhase 1〜4では使用しない（使う必要が生じたらサーバ専用・`NEXT_PUBLIC_` なしで扱う）。
- 新しい環境変数を追加したら `.env.example` とREADMEを必ず更新する。

---

## 14. Supabaseセットアップ手順

READMEにも同内容を記載すること。

1. [supabase.com](https://supabase.com) でプロジェクト作成（リージョン: `Northeast Asia (Tokyo)` 推奨）
2. Project Settings → API から URL と anon key を取得し `.env.local` へ
3. Authentication → Providers → Email を有効化。**Confirm email をオフ**（MVP設定）
4. SQL Editor で `supabase/migrations/0001_init.sql` を実行
   - 内容: 5テーブル作成 / RLS有効化＋ポリシー / `handle_new_user()` トリガー / `daily_summaries` 更新トリガー / インデックス
5. Table Editor で5テーブルとRLS有効を確認
6. （任意）`npx supabase gen types typescript` で `src/types/database.ts` を生成

**マイグレーション運用ルール**: スキーマ変更は必ず `supabase/migrations/` に連番SQLファイルとして追加し、PRに含める。ダッシュボードでの手動変更のみで済ませない（コードとDBの乖離防止）。

---

## 15. 開発フェーズ

### Phase 1（MVP）: JSON貼付 → 保存 → 一覧表示

**ゴール**: ChatGPTのJSONを貼り付けて登録し、履歴で見られる。

1. `chore/project-setup` — Next.js初期化、Tailwind、ESLint、README、`.env.example`、CI、PRテンプレート
2. `chore/cloudflare-deploy` — OpenNext設定、wrangler.jsonc、デプロイ手順書（**最初に「Hello World」を本番へ通す**）
3. `feature/supabase-setup` — マイグレーションSQL、supabaseクライアント、型生成
4. `feature/auth` — ログイン/サインアップ、middleware、usersトリガー
5. `feature/meals-api` — Zodスキーマ、`POST/GET /api/meals`、`GET/DELETE /api/meals/[id]`
6. `feature/json-import` — Import画面（貼付・検証・プレビュー・登録）
7. `feature/meal-history` — History一覧・Detail画面・削除

**Phase 1受け入れ基準**:

- [ ] 本番URLでサインアップ → ログインできる
- [ ] サンプルJSON（1.4の例）を貼付 → プレビュー表示 → 登録成功
- [ ] 不正JSON（構文エラー / calorie_kcal負値 / meal_type不正）が具体的なエラーメッセージで弾かれる
- [ ] 履歴に日付別で表示され、詳細画面で全項目確認できる
- [ ] 他ユーザーのデータが見えない（RLS検証）

### Phase 2: Dashboard

8. `feature/dashboard` — 今日のサマリー、プログレスバー、目標との差
9. `feature/settings` — 目標値編集
10. `feature/pwa` — manifest、アイコン、ホーム画面追加対応

### Phase 3: 栄養グラフ

11. `feature/nutrition-charts` — 週/月のカロリー・PFC推移（Recharts、`daily_summaries` 利用）
12. `feature/weight-management` — 体重入力・グラフ

### Phase 4: AI食事分析（設計は16.1）

13. `feature/ai-coach` — 蓄積データからのコメント生成

### Phase 5: iOSショートカット完全自動連携（設計は16.2）

14. `feature/api-token-auth` — APIキー発行・Bearer認証
15. ショートカット側の設定手順ドキュメント

> **順序厳守**: 各フェーズ内の番号順に、1ブランチ=1PRで進める。前のPRがmergeされてから次へ。

---

## 16. 将来機能の設計指針

Phase 1では実装しないが、**後から入れやすい構造にしておく**ための指針。

### 16.1 AI食事コーチ（Phase 4）

- 入力: 直近N日の `daily_summaries` + `meals`（食材傾向は `ingredients` 集計）
- 処理: LLM API（Claude API推奨）へ集計データを渡し、コメント生成
  - 例: 「タンパク質量は十分です」「脂質が3日連続で高めです」「明日は魚料理がおすすめです」
- 出力先: Dashboard上のコーチカード。生成結果は `coach_comments` テーブル（新規・要マイグレーション）にキャッシュし、1日1回生成
- 秘匿キー（LLM APIキー）はサーバ専用環境変数で管理

### 16.2 iOSショートカット直接連携（Phase 5）

- **認証**: Settings画面でユーザーがAPIキーを発行（`api_keys` テーブル: `id / user_id / key_hash / name / last_used_at / created_at`。キーはSHA-256ハッシュで保存し、平文は発行時に一度だけ表示）
- ショートカットは `Authorization: Bearer <key>` 付きで `POST /api/meals` を呼ぶ
- API側の認証解決関数を「Cookieセッション or Bearerキー」の二段構えに拡張（6.1で分離しておいた箇所）
- レート制限: 同一キー 60req/時 程度をアプリ層で実装

### 16.3 写真保存

- Supabase Storage にバケット `meal-photos` を作成し、`meals.photo_url` に格納。ショートカットからmultipartまたは署名付きURLでアップロード。

---

## 17. Sonnet向け実装指示書

**あなた（Sonnet）はこのリポジトリの実装担当です。以下の手順と規律に従って開発してください。**

### 17.1 前提と大原則

1. **リポジトリはこの仕様書のみの状態から開始**する。プロジェクト初期構築から行う。
2. **mainへの直接pushは禁止**。すべての変更は `feature/*`（または `chore/*`, `fix/*`）ブランチ → Pull Request → merge で行う。
3. コミットは [11.3](#113-コミットメッセージ規則conventional-commits) の規則に従う。小さく頻繁に。
4. **15章のフェーズ順・ブランチ順を厳守**する。一度に複数機能を混ぜたPRを作らない。
5. 迷ったら本仕様書に立ち返る。仕様書にない判断が必要な場合はPR本文に「判断メモ」として明記する。
6. 各PRは `npm run lint` / `npx tsc --noEmit` / `npm run build` が通る状態で出す。

### 17.2 ステップ0: 環境構築（最初のPR: `chore/project-setup`）

```bash
# 1. ブランチ作成
git checkout -b chore/project-setup

# 2. Next.js初期化（既存ファイルがある場合は一時退避してから展開）
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias

# 3. 追加パッケージ
npm i @supabase/supabase-js @supabase/ssr zod recharts
npm i -D wrangler @opennextjs/cloudflare

# 4. 以下を作成
#    - .env.example（13章）
#    - .github/workflows/ci.yml（11.5）
#    - .github/pull_request_template.md（11.4）
#    - README.md（17.5）
#    - 4章のディレクトリ骨格（空でよい）

# 5. コミット & push & PR
git add -A
git commit -m "chore(setup): Next.js + TypeScript + Tailwind プロジェクト初期構築"
git push -u origin chore/project-setup
# → GitHub上でPR作成（テンプレートに従い記入）
```

### 17.3 ステップ1以降

15章のブランチ計画に従い、1ブランチずつ実装 → PR → merge を繰り返す。各実装の詳細仕様は以下の章を参照:

| ブランチ | 参照章 |
|---|---|
| `chore/cloudflare-deploy` | 12章 |
| `feature/supabase-setup` | 5章・14章 |
| `feature/auth` | 9章 |
| `feature/meals-api` | 6章・7章 |
| `feature/json-import` | 8.2 |
| `feature/meal-history` | 8.4・8.5 |
| `feature/dashboard` | 8.3 |
| `feature/settings` | 8.7 |
| `feature/pwa` | 10章 |
| `feature/nutrition-charts` | 8.3・Recharts |
| `feature/weight-management` | 8.6・6.6・6.7 |

### 17.4 各PR共通のDone定義

- [ ] 仕様書の該当章の要件を満たしている
- [ ] lint / typecheck / build がローカルとCIで成功
- [ ] スマホ幅（375px）での表示確認（UI変更時）
- [ ] `.env.example`・README・マイグレーションの更新漏れがない
- [ ] PR本文に確認手順を記載

### 17.5 README.md に必ず含める内容

1. アプリ概要と全体フロー図（2章の簡略版）
2. **セットアップ手順**: clone → `npm ci` → `.env.local` 作成（`.env.example` 参照）→ `npm run dev`
3. **環境変数の説明**（13章の表）
4. **Supabaseセットアップ手順**（14章の手順そのまま）
5. **Cloudflareデプロイ設定手順**（12.3の手順そのまま）
6. **Git運用ルール**（11章要約: ブランチ戦略・コミット規則・main保護設定の依頼）
7. JSON Importの使い方（サンプルJSON付き）
8. 開発フェーズの進捗チェックリスト

### 17.6 禁止事項

- ❌ mainへの直接push
- ❌ 実値の入った `.env*` ファイルのコミット
- ❌ RLSを無効化したままのテーブル公開
- ❌ `service_role` キーのクライアント側使用・`NEXT_PUBLIC_` 化
- ❌ 仕様外の大規模ライブラリ追加（追加したい場合はPRで理由を明記して提案）
- ❌ マイグレーションファイルなしのDBスキーマ変更

### 17.7 完成イメージ（Phase 1終了時のユーザー体験）

1. iPhoneで食事写真を撮り、ChatGPTで解析してJSONをコピー
2. ホーム画面の「AI食事記録」アイコン（PWA）をタップ
3. 「＋登録」→ 貼付ボタン → プレビューで料理名・カロリー・PFC・AI評価を確認 → 登録
4. Dashboardに今日の摂取量とプログレスバーが即時反映
5. 履歴からいつでも過去の食事とAIアドバイスを振り返れる

---

*本仕様書はプロジェクトの単一の情報源（Single Source of Truth）である。実装中に仕様変更が必要になった場合は、本ファイルを更新するPRを先に（または同時に）作成すること。*
