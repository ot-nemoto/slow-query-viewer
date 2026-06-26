# アーキテクチャ

## 技術スタック

| カテゴリ | 技術 | バージョン |
|----------|------|-----------|
| フレームワーク | Next.js (App Router) | 15.5.4 |
| 言語 | TypeScript | 5 |
| UI ライブラリ | React | 19.1.0 |
| スタイリング | Tailwind CSS | 4 |
| データ可視化 | Chart.js | 4.5.0 |
| Chart.js バインディング | react-chartjs-2 | 5.3.0 |
| リンター/フォーマッタ | Biome | 2.2.4 |
| 環境変数ユーティリティ | cross-env | 10.0.0 |

## ディレクトリ構成

```
slow-query-viewer/
├── .devcontainer/          # Dev Container 設定
├── .github/
│   ├── dependabot.yml
│   └── workflows/          # CI/CD ワークフロー
├── docs/                   # プロジェクトドキュメント
├── public/
│   └── .nojekyll           # GitHub Pages 用
├── src/
│   ├── app/
│   │   ├── layout.tsx      # ルートレイアウト
│   │   ├── page.tsx        # メインページ（クライアントコンポーネント）
│   │   ├── globals.css     # グローバルスタイル（Tailwind）
│   │   └── favicon.ico
│   ├── components/
│   │   ├── StatsSummary.tsx            # 統計サマリー
│   │   ├── TimeSeriesChart.tsx         # 時系列チャート
│   │   ├── QueryAnalysisModal.tsx      # パラメータ分析モーダル
│   │   ├── NotificationContainer.tsx   # 通知コンテナ
│   │   └── NotificationToast.tsx       # トースト通知
│   └── lib/
│       └── slowQueryParser.ts          # ログ解析・正規化ロジック
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── biome.json
├── next.config.ts
└── postcss.config.mjs
```

## 環境変数

| 変数名 | 用途 | 設定タイミング |
|--------|------|---------------|
| `BUILD_MODE` | `static` を設定すると GitHub Pages 向け静的ビルドになる | ビルド時のみ |

ランタイムの環境変数は不要（クライアントサイド完結）。

## ビルドモード

### 開発モード

```bash
npm run dev
```

`http://localhost:3000` で起動。ホットリロード有効。

### 静的ビルド（GitHub Pages）

```bash
npm run build:static
```

- `BUILD_MODE=static` により `next.config.ts` で以下が有効になる:
  - `output: "export"`（静的出力）
  - `basePath: "/slow-query-viewer"`
  - `assetPrefix: "/slow-query-viewer"`
  - `trailingSlash: true`
  - `images.unoptimized: true`
- 出力先: `out/`

## コーディング規約

- **フォーマッタ/リンター**: Biome（`biome.json` で設定）
- **インデント**: スペース 2
- **クォート**: ダブルクォート（JSX 含む）
- **パスエイリアス**: `@/*` → `./src/*`
- **コンポーネント**: ページコンポーネント（`page.tsx`）はクライアントコンポーネント（`"use client"`）として実装
