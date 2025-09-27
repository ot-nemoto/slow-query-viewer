# MySQL スロークエリ解析ツール

MySQLのスロークエリログファイルをアップロードして解析し、クエリのパフォーマンスを可視化するNext.jsアプリケーションです。

## 機能

- **複数ファイルアップロード**:
  - `.log`や`.txt`形式のスロークエリログファイルを複数同時にアップロード可能
  - アップロード済みファイルの一覧表示と個別削除機能
  - 複数ファイルを統合して一括解析
- **統計サマリー**: 総クエリ数、総実行時間、平均実行時間、最大実行時間などの統計情報を表示
- **時系列グラフ**: Chart.jsを使用してクエリ実行時間の時系列変化をグラフで可視化
- **クエリ解析表**:
  - クエリの正規化（数値や文字列リテラルをプレースホルダーに置換）
  - 同一パターンのクエリをグループ化
  - 実行回数、総実行時間、平均実行時間でソート
  - 総実行時間の高い順に表示（パフォーマンス問題のあるクエリを優先表示）

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **グラフ**: Chart.js + react-chartjs-2

## セットアップ

1. 依存関係をインストール:
```bash
npm install
```

2. 開発サーバーを起動:
```bash
npm run dev
```

3. ブラウザで http://localhost:3000 にアクセス

## ビルドオプション

このアプリケーションは2つのモードでビルドできます：

### 1. 通常のNext.jsアプリケーション（サーバー対応）
```bash
npm run build
npm start
```
- Node.js環境で動作
- `.next/` ディレクトリに生成
- `next start` でサーバーを起動

### 2. 静的サイト（完全クライアントサイド）
```bash
npm run build:static
```
- 静的ファイルのみで動作
- `out/` ディレクトリに生成
- CDN、GitHub Pages、Netlify等でホスティング可能
- Windows、macOS、Linux対応（cross-env使用）

例：静的サイトをローカルでテスト
```bash
cd out
python3 -m http.server 8080
```

## 使用方法

1. MySQLのスロークエリログファイルを準備
2. アプリケーションのファイルアップロード欄からログファイルを選択
   - 複数ファイルを同時に選択可能（Ctrl+クリックまたはShift+クリック）
   - 追加でファイルをアップロードすることも可能
3. 自動的に解析が実行され、統合された結果が表示されます
4. 不要なファイルは個別に削除するか、「全て削除」で一括削除可能

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

## ファイル構造

```
src/
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── StatsSummary.tsx
│   └── TimeSeriesChart.tsx
└── lib/
    └── slowQueryParser.ts
```

## GitHub Pagesデプロイ

このプロジェクトはGitHub Pagesに自動デプロイされます。

### デプロイ条件
- masterブランチへのpush時に自動的にデプロイされます
- GitHub Actionsを使用して静的ビルドとデプロイを実行

### アクセス方法
デプロイ後は以下のURLでアクセスできます：
```
https://ot-nemoto.github.io/slow-query-viewer/
```

### デプロイフロー
1. masterブランチへコードをpush
2. GitHub Actionsが自動実行
3. `npm run build:static`で静的ファイルを生成
4. GitHub Pagesに自動デプロイ

### ローカルでの静的ビルド確認
```bash
npm run build:static
cd out
python3 -m http.server 8080
```

## 貢献

プルリクエストやイシューは歓迎します。

## ライセンス

MIT
