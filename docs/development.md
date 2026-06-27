# 開発ガイド

## ローカルセットアップ

### 前提条件

- Node.js 24 以上（または Dev Container を使用）
- npm

### インストール

```bash
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

`http://localhost:3000` でアクセス。ホットリロード有効。

### Dev Container

`.devcontainer/devcontainer.json` で設定済み。

- イメージ: `mcr.microsoft.com/devcontainers/typescript-node:4-24-trixie`
- 拡張機能: Biome
- Feature: Claude Code, GitHub CLI
- 初期化コマンド: `npm install`

## 環境変数

| 変数名 | 値 | 用途 |
|--------|---|------|
| `BUILD_MODE` | `static` | GitHub Pages 向け静的ビルド時に設定 |

`.env` ファイルは不要。

## npm スクリプト

| スクリプト | コマンド | 用途 |
|-----------|---------|------|
| `dev` | `next dev` | 開発サーバー |
| `build` | `next build` | プロダクションビルド |
| `build:static` | `cross-env BUILD_MODE=static next build` | 静的ビルド |
| `start` | `next start` | プロダクションサーバー起動 |
| `lint` | `biome lint src/` | リンティング |
| `format` | `biome format src/ --write` | フォーマット |
| `test` | `vitest run` | テスト |

## デプロイ手順

### GitHub Pages（自動）

`develop` ブランチへのプッシュで自動デプロイされる。

1. `develop` にマージ / プッシュ
2. GitHub Actions が `npm run build:static` を実行
3. `out/` の静的ファイルが GitHub Pages に公開

**公開 URL**: https://ot-nemoto.github.io/slow-query-viewer/

### ローカルで静的ビルドを確認

```bash
npm run build:static
cd out
python3 -m http.server 8080
```

`http://localhost:8080/slow-query-viewer/` でアクセス。
