# AI食事記録

写真を撮るだけで食事記録・栄養管理が完成するAI食事管理Webアプリ。

iPhoneで撮影した食事写真をChatGPT Visionで解析し、得られた栄養JSONを本アプリで登録・管理します。

詳細な設計・仕様は [`SPECIFICATION.md`](./SPECIFICATION.md) を参照してください。

## 全体フロー

```
撮影 → ChatGPT Vision解析 → JSON取得
  ↓（Phase 1: 手動コピー& 貼付 / Phase 5: iOSショートカットが自動送信）
POST /api/meals（共通の登録API）
  ↓
Supabase PostgreSQL
  ↓
Dashboard / 履歴 / 栄養グラフ / AIコーチ で確認
```

## セットアップ

```bash
git clone <このリポジトリ>
cd diet
npm ci
cp .env.example .env.local   # 値を設定（下記「環境変数」参照）
npm run dev
```

http://localhost:3000 を開くとログイン画面が表示されます。

## 環境変数

`.env.local` に以下を設定してください（`.env.example` を参照）。

| 変数 | 説明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトのURL（Project Settings > API） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseの anon (public) key。RLS前提でブラウザ公開可 |

`.env.local` などの実値ファイルはコミットしないでください（`.gitignore` 済み）。

## Supabaseセットアップ

1. [supabase.com](https://supabase.com) でプロジェクトを作成（リージョン: Tokyo推奨）
2. Project Settings → API から URL と anon key を取得し `.env.local` へ設定
3. Authentication → Providers → Email を有効化し、**Confirm email をオフ**（MVP設定）
4. SQL Editor で `supabase/migrations/0001_init.sql` を実行
   - 5テーブル作成、RLS有効化、`users`自動作成トリガー、`daily_summaries`自動更新トリガー、インデックスを含む
5. Table Editor で5テーブルとRLSが有効になっていることを確認

スキーマ変更は必ず `supabase/migrations/` に連番SQLファイルを追加してPRに含めてください。ダッシュボードでの手動変更のみで済ませないこと。

## Cloudflareデプロイ設定

本番ホスティングは **Cloudflare Workers**（`@opennextjs/cloudflare` アダプタ）を使用します。

1. Cloudflareダッシュボード → Workers & Pages → Create → Workers → Connect to Git
2. GitHubアカウントを連携し、このリポジトリを選択
3. ビルド設定:
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
   - Production branch: `main`
4. Variables and Secrets に以下を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. 保存すると初回ビルドが走り、`https://diet.<account>.workers.dev` で公開されます

> Cloudflare側のWorker名（Settings > General の Worker名）は、`wrangler.jsonc` の `name` フィールドと完全に一致している必要があります（現在は `diet`）。一致しないとビルドが失敗します。

mainへのmergeで自動ビルド・デプロイが実行され、PRではPreview URLが自動発行されます。

ローカルでのビルド確認:

```bash
npm run preview   # ローカルでCloudflare Workers環境をプレビュー
npm run deploy    # 手動デプロイ（通常はCI/CD経由を推奨）
```

## Git運用ルール

- `main` への直接pushは禁止。すべての変更は `feature/*`（または `fix/*`, `chore/*`）ブランチ → Pull Request → レビュー → merge で行います。
- コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) 形式（`feat: `, `fix: `, `chore: ` など）。
- リポジトリ管理者は GitHub の Settings → Branches で `main` にブランチ保護ルール（PR必須・ステータスチェック必須）を設定してください。

詳細は `SPECIFICATION.md` の11章を参照してください。

## JSON Importの使い方

1. ChatGPTで食事写真を解析し、栄養JSONを取得
2. アプリの「＋登録」タブ（`/import`）を開く
3. JSONをコピー&貼り付け（またはクリップボードから貼付ボタン）
4. 自動でバリデーション・プレビューが表示される
5. 内容を確認して「登録する」

**サンプルJSON**:

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

このJSONは手動貼付・iOSショートカット自動送信のいずれからも同じ `POST /api/meals` に送信されます。

## 開発フェーズ進捗

- [x] Phase 1: JSON貼付 → 保存 → 一覧表示（JSON Import / Meal History / Meal Detail / 認証 / API基盤）
- [x] Phase 2: Dashboard（今日の摂取量サマリー・目標値設定）
- [x] Phase 3: 栄養グラフ（体重・体脂肪率のRechartsグラフ）
- [ ] Phase 4: AI食事分析（AIコーチ機能）
- [ ] Phase 5: iOSショートカット完全自動連携（APIキー認証）

## スクリプト

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run lint` | ESLint |
| `npm run build` | 本番ビルド（Next.js） |
| `npm run preview` | Cloudflare Workers環境でのローカルプレビュー |
| `npm run deploy` | Cloudflare Workersへ手動デプロイ |
