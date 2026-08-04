# VPS デプロイ

Next.js フロントエンドを Docker で VPS にデプロイする手順。
バックエンド（DB・Storage）は引き続き Supabase を使用するため、変更は不要。

## 前提条件

- Docker + Docker Compose がインストールされた VPS（Linux）
- Supabase プロジェクトの接続情報・シークレットが揃っていること
- 環境変数（下記参照）

## 環境変数

`.env.example` を `.env` にコピーして値を埋める。

### ビルド時（NEXT_PUBLIC_*）

`next build` 時にクライアントバンドルへ埋め込まれる。docker-compose の
`build.args` 経由で渡すため、値の変更にはイメージの再ビルドが必要。

| 変数                                   | 説明                      |
| -------------------------------------- | ------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 公開キー         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | Supabase anon key         |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`         | Web Push の公開鍵         |

### 実行時（サーバー側シークレット）

`env_file: .env` 経由でコンテナの実行環境に渡される。

| 変数                        | 説明                                            |
| --------------------------- | ----------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key（公開しない）         |
| `NEXTAUTH_SECRET`           | JWT 署名用の秘密鍵（`openssl rand -base64 32`） |
| `NEXTAUTH_URL`              | 本番 URL（例: `https://note.example.com`）      |
| `VAPID_PRIVATE_KEY`         | Web Push の秘密鍵                               |
| `VAPID_SUBJECT`             | Web Push の送信者情報                           |

## ビルド & 起動

```bash
cp .env.example .env
# .env に実値を入力
docker compose up -d --build
```

起動確認:

```bash
curl http://localhost:3000
docker compose logs -f app
```

更新を反映する場合:

```bash
git pull
docker compose up -d --build
```

## HTTPS（推奨）

本番では TLS 終端用にリバースプロキシ（Caddy や nginx）をフロントに置くこと。

- Caddy: 自動で Let's Encrypt 証明書を取得（推奨）
- nginx: `proxy_pass http://127.0.0.1:3000;` を設定

このリポジトリではリバースプロキシ自体は管理しない。

## 注意

- バックエンドは Supabase のまま変更なし。この Docker デプロイは Next.js フロントエンドのみ。
- `docker build` は開発環境に Docker デーモンがないため未検証。
  Dockerfile のビルド処理は `npm run build`（standalone 出力）と同等であり、
  CI で `npm run build` の成功により検証している。
