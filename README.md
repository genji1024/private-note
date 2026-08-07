# private-note

プライベートなノート共有 Web サービス。

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL + Storage)
- NextAuth.js (Credentials Provider)

## 機能

- 日記の作成・編集・削除・閲覧（1日複数エントリ可）
- 画像添付
- 既読機能
- ミニマルデザイン・レスポンシブ対応
- 日本語のみ

## デプロイ

Docker で VPS にデプロイ可能。バックエンド（DB・Storage）は引き続き Supabase を使用するため、環境の変更は不要。詳細な手順は [`DEPLOY.md`](./DEPLOY.md) を参照。

### 環境変数

`.env.example` を `.env` にコピーし、各値を埋める。

| 変数                                   | 種別         | 取得方法                                                                                              |
| -------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | [BUILD-TIME] | Supabase ダッシュボード > Project Settings > API > Project URL                                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | [BUILD-TIME] | Supabase ダッシュボード > Project Settings > API > Project API keys（publishable）                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | [BUILD-TIME] | Supabase ダッシュボード > Project Settings > API > Project API keys（anon）                           |
| `SUPABASE_SERVICE_ROLE_KEY`            | [RUNTIME]    | Supabase ダッシュボード > Project Settings > API > Project API keys（service_role）。絶対に公開しない |
| `NEXTAUTH_SECRET`                      | [RUNTIME]    | `openssl rand -base64 32` で生成                                                                      |
| `NEXTAUTH_URL`                         | [RUNTIME]    | デプロイ先の本番 URL（例: `https://note.example.com`）                                                |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`         | [BUILD-TIME] | VAPID 鍵ペア生成コマンドで出力された公開鍵                                                            |
| `NEXT_PUBLIC_BASE_PATH`                | [BUILD-TIME] | サブパスデプロイ用（例: Nginx `location /note` なら `/note`）。ルート直下の場合は空欄                 |
| `VAPID_PRIVATE_KEY`                    | [RUNTIME]    | VAPID 鍵ペア生成コマンドで出力された秘密鍵                                                            |
| `VAPID_SUBJECT`                        | [RUNTIME]    | 通知の送信者情報（例: `mailto:admin@example.com`）                                                    |

### VAPID 鍵の生成

```bash
npx web-push generate-vapid-keys
```

### 起動

```bash
cp .env.example .env
# .env に実値を入力
docker compose up -d --build
```

ビルド・HTTPS 設定・更新手順など、詳細は [`DEPLOY.md`](./DEPLOY.md) を参照。
