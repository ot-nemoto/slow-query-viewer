# MySQL スロークエリ解析ツール

[![CI](https://github.com/ot-nemoto/slow-query-viewer/actions/workflows/ci.yml/badge.svg)](https://github.com/ot-nemoto/slow-query-viewer/actions/workflows/ci.yml)
[![Pages](https://github.com/ot-nemoto/slow-query-viewer/actions/workflows/deploy-github-pages.yml/badge.svg)](https://github.com/ot-nemoto/slow-query-viewer/actions/workflows/deploy-github-pages.yml)
[![License](https://img.shields.io/github/license/ot-nemoto/slow-query-viewer)](https://github.com/ot-nemoto/slow-query-viewer/blob/master/LICENSE)

MySQL のスロークエリログファイルをブラウザ上で解析・可視化するツールです。

## 主な機能

- ファイルアップロード（複数ファイル、ドラッグ＆ドロップ対応）
- 統計サマリー（総クエリ数、実行時間の各指標、最遅クエリ詳細）
- クエリの正規化・グルーピング・ソートによる解析テーブル
- パラメータ値別の詳細分析（モーダル表示）
- 時系列チャート（ファイル別の表示切り替え対応）

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [docs/product.md](docs/product.md) | プロダクト定義（目的・対象ユーザー・成功指標） |
| [docs/requirements.md](docs/requirements.md) | 機能要件・非機能要件 |
| [docs/architecture.md](docs/architecture.md) | 技術スタック・ディレクトリ構成・ビルドモード |
| [docs/ui.md](docs/ui.md) | 画面一覧・コンポーネント・UI 規約 |
| [docs/development.md](docs/development.md) | 開発・デプロイ手順 |
| [docs/testing.md](docs/testing.md) | テスト方針・カバレッジ規約 |
| [docs/e2e-scenarios.md](docs/e2e-scenarios.md) | E2E テストシナリオ |
| [docs/tasks.md](docs/tasks.md) | タスク管理・フェーズ構成 |

## クイックスタート

```bash
npm install
npm run dev
```

詳細は [docs/development.md](docs/development.md) を参照。
