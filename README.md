@'
# FAQ Flow AI｜問い合わせ対応・FAQ改善ダッシュボード

FAQ Flow AI は、社内問い合わせや顧客対応の履歴を一元管理し、対応状況・FAQ化候補・改善ポイントを可視化する業務改善アプリです。

Cloudflare Pages / Pages Functions / D1 / Workers AI を使用し、Firebaseを使わずにサーバーレス構成で構築しています。

## Demo

- Cloudflare Pages: デプロイ後にURLを記載
- GitHub Repository: デプロイ後にURLを記載

## 概要

問い合わせ対応では、同じ質問が何度も発生したり、対応履歴が担当者ごとに分散したり、FAQ化すべき内容が見えづらいという課題があります。

このアプリでは、問い合わせ内容・カテゴリ・優先度・ステータス・回答メモを管理し、D1に保存します。さらに Workers AI を使って、回答案・FAQ案・改善レポートを生成できます。

## 主な機能

- 問い合わせ登録
- 問い合わせ一覧表示
- 編集・削除
- キーワード検索
- ステータス絞り込み
- カテゴリ絞り込み
- FAQ候補チェック
- CSV出力
- A4印刷
- AI回答案生成
- AI FAQ案生成
- AI改善レポート生成
- D1によるデータ保存
- Cloudflare Pages Functions API

## 使用技術

- React
- TypeScript
- Vite
- CSS
- Cloudflare Pages
- Cloudflare Pages Functions
- Cloudflare D1
- Cloudflare Workers AI
- Wrangler

## 技術構成

```txt
src/
  App.tsx
  main.tsx
  index.css

functions/
  api/
    _shared.ts
    health.ts
    tickets.ts
    tickets/
      [id].ts
    ai/
      reply.ts
      faq.ts
      report.ts

schema.sql
wrangler.toml