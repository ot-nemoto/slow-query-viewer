# MySQL スロークエリ解析ツール

MySQLのスロークエリログファイルをアップロードして解析し、クエリのパフォーマンスを可視化するNext.jsアプリケーションです。

🌐 **デプロイ先**: [https://ot-nemoto.github.io/slow-query-viewer/](https://ot-nemoto.github.io/slow-query-viewer/)

## クイックスタート (Try it)

1. 依存関係をインストール:
```bash
npm install
```

2. 開発サーバーを起動:
```bash
npm run dev
```

3. ブラウザで http://localhost:3000 にアクセス

## 主な機能

- ファイルアップロード（複数ファイル、ドラッグ&ドロップ対応）
- 統計サマリー（総クエリ数、総実行時間、平均・最大・最小など）
- クエリの正規化・グルーピング・ソートによる解析表表示
- 詳細なパラメータ別分析（モーダル表示で実行回数・平均/最大/最小時間を確認）
- 時系列グラフ（Chart.js によるインタラクティブな表示）
- アップロード済みファイルの一覧表示・個別削除・全削除

## サンプルデータ

テスト用のサンプルスロークエリログが必要な場合は、以下のような形式のファイルを作成してください：

```
# Time: 2025-09-26T03:00:29.449806Z
# User@Host: user[user] @  [192.168.1.1]  Id: 12345
# Query_time: 17.175956  Lock_time: 0.000004 Rows_sent: 1  Rows_examined: 49444
use database_name;
SET timestamp=1758855612;
SELECT count(*) FROM table_name WHERE condition='value';
```

注: サンプルのタイムスタンプにはマイクロ秒まで含まれる場合がありますが、ブラウザの JavaScript の Date オブジェクトはミリ秒単位までの精度を扱います。極めて細かい時間精度が必要な場合は、パース時に切り捨てや丸めが発生する可能性がある点にご留意ください。

## ファイル構造

```
src/
├── app/
│   ├── favicon.ico          # アプリケーションアイコン
│   ├── globals.css         # グローバルスタイル
│   ├── layout.tsx          # レイアウトコンポーネント
│   └── page.tsx            # メインページ（アップロード・解析UI）
├── components/
│   ├── QueryAnalysisModal.tsx  # クエリパラメータ分析モーダル
│   ├── StatsSummary.tsx        # 統計サマリーコンポーネント
│   └── TimeSeriesChart.tsx     # 時系列グラフコンポーネント
└── lib/
    └── slowQueryParser.ts      # スロークエリログパーサー
```

## 技術スタック

- フレームワーク: Next.js 15.5.4 (App Router)
- 言語: TypeScript 5
- UI / ライブラリ: React 19.1.0, Tailwind CSS 4
- データ可視化: Chart.js 4.5.0 + react-chartjs-2 5.3.0
- 開発ツール: Biome (フォーマット/リンティング), cross-env

## ビルドと開発の詳細

### スクリプト

主要な npm スクリプトは `package.json` に定義されています（例）:

- `dev`: 開発サーバーを起動（`next dev`）
- `build`: 通常の Next.js ビルド
- `build:static`: 静的出力を作る（`cross-env BUILD_MODE=static next build`）
- `start`: ビルド後のサーバー起動（`next start`）

### ビルドモード

1) 通常の Next.js（サーバー対応）

```bash
npm run build
npm start
```

2) 静的サイト（完全クライアントサイド、GitHub Pages 等でホスティング）

```bash
npm run build:static
```

- 静的ファイルは `out/` に生成されます。
- ローカルで確認する場合:

```bash
cd out
python3 -m http.server 8080
# ブラウザで http://localhost:8080 にアクセス
```

## デプロイ

このプロジェクトは GitHub Pages に自動デプロイされる設定です。

**アクセスURL**: [https://ot-nemoto.github.io/slow-query-viewer/](https://ot-nemoto.github.io/slow-query-viewer/)

デプロイフローの概略:

1. master ブランチへ push
2. GitHub Actions が `npm run build:static` を実行
3. `out/` の静的ファイルが GitHub Pages に公開

## ライセンス

MIT
