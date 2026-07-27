# Development Skills

このディレクトリには、chihiro-note プロジェクトの開発で得られた知見をスキルとしてまとめています。

各スキルは `skill-name/SKILL.md` の形式（anthropics/skills 準拠）で管理されています。

## スキル一覧

1. [supabase-setup](./supabase-setup/SKILL.md) — Supabase データベース・Storage のセットアップ手順
2. [nextauth-credentials](./nextauth-credentials/SKILL.md) — NextAuth Credentials Provider の実装パターン
3. [image-upload](./image-upload/SKILL.md) — 画像アップロード機能の実装パターン（単数・複数）
4. [server-side-supabase](./server-side-supabase/SKILL.md) — サーバー側での Supabase 使用パターン
5. [build-and-verify](./build-and-verify/SKILL.md) — ビルド・動作確認の手順
6. [project-conventions](./project-conventions/SKILL.md) — プロジェクトの規約・設計方針
7. [sql-idempotency](./sql-idempotency/SKILL.md) — SQL の冪等性パターン（マイグレーション安全対策）
8. [pr-workflow](./pr-workflow/SKILL.md) — PR 作成・レビュー・CI 検証のワークフロー
9. [merge-conflict-resolution](./merge-conflict-resolution/SKILL.md) — マージ後のコンフリクト解決手順

## スキルの編集ルール

- 開発で知見を得た場合は、該当するスキルファイルを追加・編集する
- スキル変更は**作業中の PR に含める**（スキル変更のみの PR は作成しない）
- 新しい知見カテゴリが必要な場合は、新しいディレクトリを作成し `SKILL.md` を配置して、この README に追記する
