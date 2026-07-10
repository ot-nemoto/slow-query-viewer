# アーキテクチャ

## 技術スタック

技術スタックのバージョンは `package.json` を参照。

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| UI ライブラリ | React |
| スタイリング | Tailwind CSS |
| データ可視化 | Chart.js + react-chartjs-2 |
| リンター/フォーマッタ | Biome |
| テストフレームワーク | Vitest |

## 非機能要件

- **デプロイ**: GitHub Pages への静的デプロイ（サーバー不要）
- **処理方式**: すべての解析はクライアントサイド（ブラウザ内）で完結する
- **レスポンシブ**: モバイル・デスクトップ対応

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
