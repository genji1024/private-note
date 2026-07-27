---
name: build-and-verify
description: ビルド・動作確認の手順
---

# Build and Verify

## ビルド手順

```bash
rm -rf .next          # .next キャッシュクリア
npx tsc --noEmit      # 型チェック
npm run build         # Next.js ビルド
```

### 注意点

- `.next` キャッシュが古いとビルドエラーになることがあるため、必ずクリアする
- `tsc --noEmit` は `node_modules` の型エラーを除外して確認: `npx tsc --noEmit 2>&1 | grep -v node_modules`
- tsconfig の `@/*` パスは `./src/*` に設定（src/ ディレクトリ使用時）

## Lint・Format

```bash
npm run lint          # ESLint（--max-warnings 0 付き）
npm run format:check  # Prettier フォーマットチェック
npm run format        # Prettier フォーマット適用
npm run typecheck     # tsc --noEmit
```

## CI チェック

コード変更後、プッシュ前に以下の4ステップを**すべて**ローカルで実行:

1. `npm run lint --max-warnings 0`
2. `npm run format:check`
3. `npm run typecheck`
4. `npm run build`

CI のステータスも必ず確認する — `pull_request_read(method="get_check_runs")` を使用。

## 動作確認（E2E）

1. Supabase SQL を全て実行（`supabase-setup` スキル参照）
2. `.env.local` を設定
3. `npm run dev` で開発サーバー起動
4. http://localhost:3000 にアクセス
5. ログイン → 日記投稿 → スレッド投稿 → 画像アップロード → 既読 → ログアウト

### E2E テスト（curl使用時）

- `curl --http1.1` を使用（HTTP/2 でエラーになるため）
- CSRF トークン取得 → credentials ログイン → セッションクッキー使用
