---
name: project-conventions
description: プロジェクトの規約・設計方針
---

# Project Conventions

## 技術スタック

- Next.js 14 (App Router) + TypeScript
- Supabase (PostgreSQL) — DB + Storage
- NextAuth.js (Credentials Provider) — 認証
- ESLint + Prettier — Lint・Format

## 設計方針

- 2ユーザ（genji + chihiro）専用の交換日記Webサービス
- ユーザ名+パスワード認証
- 日記CRUD（1日複数投稿可）+ 画像添付
- スレッド機能（ユーザが追加・削除可能、日記はデフォルト削除不可）
- 既読機能（相手が読んだか分かる）
- ミニマルデザイン、モバイルレスポンシブ、日本語のみ

## tsconfig

- `@/*` パスは `./src/*` に設定（src/ ディレクトリ使用時）
- `target: es5` は既存設定（変更注意）

## PR 規約

- Assignee: bot-genji1024
- Reviewer: g-ohara
- ラベル: 機能追加は `enhancement`、ドキュメントは `documentation`
- PR作成時に必ずコンフリクトがないことを確認
- レビュー依頼時にレビュアーをメンションして明確に依頼
- `Closes #N` でイシュー自動クローズ

## スキル管理

- 開発知見は `.agents/skills/` 以下にスキルとしてまとめる
- スキル変更は**作業中の PR に含める**（スキル変更のみの PR は作成しない）

## ユーザ情報

- genji / genji（パスワード = ユーザ名）
- chihiro / chihiro（パスワード = ユーザ名）
- パスワードは初回ログイン後変更可能（`update_password()` 関数）

## Supabase プロジェクト

- URL: `https://gnoqaaapfdfrmmnwrwzg.supabase.co`
- Storage バケット: `images`（public）
