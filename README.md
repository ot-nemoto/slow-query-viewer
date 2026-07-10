# MySQL スロークエリ解析ツール

![CI](https://github.com/ot-nemoto/slow-query-viewer/actions/workflows/ci.yml/badge.svg)
![Version](https://img.shields.io/github/package-json/v/ot-nemoto/slow-query-viewer)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

MySQL のスロークエリログファイルをブラウザ上で解析・可視化するツールです。

## 主な機能

- ファイルアップロード（複数ファイル、ドラッグ＆ドロップ対応）
- 統計サマリー（総クエリ数、実行時間の各指標、最遅クエリ詳細）
- クエリの正規化・グルーピング・ソートによる解析テーブル
- パラメータ値別の詳細分析（モーダル表示）
- 時系列チャート（ファイル別の表示切り替え対応）

詳細は [docs/product.md](docs/product.md) を参照。

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [docs/product.md](docs/product.md) | プロダクト定義（目的・対象ユーザー・成功指標・主要機能） |
| [docs/architecture.md](docs/architecture.md) | 技術スタック・非機能要件・ビルドモード・コーディング規約 |
| [docs/ui.md](docs/ui.md) | デザインシステム・画面仕様・UI 規約 |
| [docs/development.md](docs/development.md) | ローカルセットアップ・デプロイ手順 |

## クイックスタート

```bash
npm install
npm run dev
```

詳細は [docs/development.md](docs/development.md) を参照。
