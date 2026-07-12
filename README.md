# AI食事記録

写真を撮るだけで食事記録・栄養管理が完成するAI食事管理Webアプリ。

iPhoneで撮影した食事写真をChatGPT Visionで解析し、得られた栄養JSONを本アプリで登録・管理する。

## 実装者（Claude Sonnet）へ

**開発を始める前に、必ず [`SPECIFICATION.md`](./SPECIFICATION.md) を最初から最後まで読むこと。**

仕様書には以下がすべて定義されている:

- 技術スタックと選定理由（Next.js / TypeScript / Tailwind / Supabase / Recharts / Cloudflare Workers）
- データベース設計（テーブル・RLS・トリガー・インデックス）
- API設計（`POST /api/meals` ほか）とJSONバリデーション仕様
- 全画面の設計（JSON Import / Dashboard / History / Detail / Weight / Settings）
- Git運用ルール（feature ブランチ / PR必須 / main直接push禁止 / コミット規則）
- Cloudflare自動デプロイ設定
- 開発フェーズと実装順序（17章「Sonnet向け実装指示書」から着手）

最初のタスクは仕様書 **17.2 ステップ0**（`chore/project-setup` ブランチでのプロジェクト初期構築）。
初期構築PRのマージ後、この README は仕様書 17.5 の内容で全面的に書き換えること。

## 開発フロー（要約）

```
main（直接push禁止）
  └── feature/xxx → commit → Pull Request → レビュー → merge → Cloudflare自動デプロイ
```
