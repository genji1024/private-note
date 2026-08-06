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

| 変数                                   | 説明                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase プロジェクト URL                                                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 公開キー                                                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | Supabase anon key                                                                  |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`         | Web Push の公開鍵                                                                  |
| `NEXT_PUBLIC_BASE_PATH`                | サブパスデプロイ用（例: Nginx `location /note/` なら `/note`）。ルート直下なら空欄 |

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

### サブパスデプロイ（例: `https://example.com/note/`）

`/note/` 配下にデプロイする場合は以下の手順で設定する。

1. `.env` に `NEXT_PUBLIC_BASE_PATH=/note` を設定（値の変更はイメージの再ビルドが必要）
2. `NEXTAUTH_URL` もサブパス込みにする（例: `https://example.com/note/api/auth`）
3. Nginx の `location /note/` ブロックで `proxy_pass http://127.0.0.1:3000;` を指定する（**末尾スラッシュなし**）

```nginx
location /note/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

`location /note/`（プレフィックス一致）は `/note/login` や `/note/api/...` をすべて
カバーする。スラッシュなしの `/note` へのアクセスは、Next.js がアプリ内で
`/note` → 307 → `/note/login` にリダイレクトするため、Nginx 側でのリダイレクトは不要。

> ※ リダイレクト用の `location = /note { return 301 /note/; }` のようなルールを入れると、
> Next.js が `/note/` → 308 → `/note` を返すため、301 / 302 系の `return /note/`
> リダイレクトはどちらも 308 との無限ループ（`ERR_TOO_MANY_REDIRECTS`）になります。
> このルールは入れないでください。

> ※ `proxy_pass` の末尾にスラッシュを付けると（`http://127.0.0.1:3000/`）、Nginx が
> `/note/` プレフィックスを剥がして Next.js に渡してしまい、basePath が一致しないため
> 404 になります。末尾スラッシュなしを維持してください。

ルート直下（`https://example.com/`）にデプロイする場合は `NEXT_PUBLIC_BASE_PATH` を空欄のままにする。

## トラブルシューティング

### `/note` にアクセスすると 404 This page could not be found. が出る

最有力原因は、デプロイ環境の Docker イメージが `NEXT_PUBLIC_BASE_PATH=/note` を指定せずにビルドされていることです（basePath 空 のアプリは `/note/*` を提供せず 404 を返します）。以下の手順で切り分けてください。

1. `.env` に `NEXT_PUBLIC_BASE_PATH=/note` が記載されているか確認（[BUILD-TIME] ラベルの環境変数は docker compose build 時にのみ読み込まれます）
2. 設定を変更した場合は イメージの再ビルド が必要です:
   ```bash
   docker compose build        # .env の NEXT_PUBLIC_BASE_PATH が build.args 経由で Dockerfile に渡される
   docker compose up -d --force-recreate
   ```
3. 稼働中コンテナで basePath が焼き込まれているか確認:
   ```bash
   docker compose exec app grep -o '"basePath":"[^"]*"' /app/server.js
   # 期待: "basePath":"/note"
   # basePath 空の場合: "basePath":""
   ```
4. Nginx の `proxy_pass` の末尾スラッシュを確認:
   - `proxy_pass http://127.0.0.1:3000;`（末尾スラッシュなし = OK）
   - `proxy_pass http://127.0.0.1:3000/;`（末尾スラッシュあり = NG。`/note/` プレフィックスが剥がれて 404 になる）
5. 期待される HTTP レスポンス:
   ```bash
   curl -sI https://example.com/note
   # 307 Location: /note/login が返れば正常（basePath が焼き込まれていれば）
   # 404 が返る場合は basePath が焼き込まれていないので手順1-3 をやり直す
   ```

### `/note` にアクセスすると ERR_TOO_MANY_REDIRECTS になる

Nginx の `location = /note { return 301 /note/; }` のようなルールが残っていると、Next.js の `/note/` → 308 → `/note` とループします。301 / 302 系の `return /note/` リダイレクトはどちらも不可です。このルールは削除してください。Next.js は `/note` → 307 → `/note/login` をアプリ内で完結するため不要です。

## 注意

- バックエンドは Supabase のまま変更なし。この Docker デプロイは Next.js フロントエンドのみ。
- `docker build` は開発環境に Docker デーモンがないため未検証。
  Dockerfile のビルド処理は `npm run build`（standalone 出力）と同等であり、
  CI で `npm run build` の成功により検証している。
