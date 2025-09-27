# MySQL スロークエリ解析ツール

MySQLのスロークエリログファイルをアップロードして解析し、クエリのパフォーマンスを可視化するNext.jsアプリケーションです。

🌐 **デプロイ先**: [https://ot-nemoto.github.io/slow-query-viewer/](https://ot-nemoto.github.io/slow-query-viewer/)

## 機能

- **複数ファイルアップロード**:
  - `.log`や`.txt`形式のスロークエリログファイルを複数同時にアップロード可能
  - ドラッグ&ドロップによる直感的なファイルアップロード
  - アップロード済みファイルの一覧表示と個別削除機能
  - 複数ファイルを統合して一括解析

- **統計サマリー**:
  - 総クエリ数、総実行時間、平均実行時間、最大実行時間などの統計情報を表示
  - リアルタイム計算による動的な統計情報更新

- **時系列グラフ**:
  - Chart.jsを使用してクエリ実行時間の時系列変化をグラフで可視化
  - インタラクティブなグラフ表示

- **クエリ解析表**:
  - クエリの正規化（数値や文字列リテラルをプレースホルダーに置換）
  - 同一パターンのクエリをグループ化
  - 実行回数、総実行時間、平均実行時間でソート可能
  - 総実行時間の高い順に表示（パフォーマンス問題のあるクエリを優先表示）

- **詳細なクエリパラメータ分析**:
  - 各クエリをクリックして詳細なパラメータ分析モーダルを表示
  - 同じ正規化クエリの実際のパラメータ値別の実行統計
  - パラメータ値ごとの実行回数、平均・最大・最小実行時間の分析
  - クエリのパフォーマンス問題の詳細な特定が可能

## 技術スタック

- **フレームワーク**: Next.js 15.5.4 (App Router)
- **言語**: TypeScript 5
- **UI/スタイリング**:
  - Tailwind CSS 4
  - React 19.1.0
- **データ可視化**: Chart.js 4.5.0 + react-chartjs-2 5.3.0
- **開発ツール**:
  - Biome (コード品質管理)
  - ESLint (コードリンティング)
  - cross-env (クロスプラットフォーム対応)

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

1. **ファイルアップロード**:
   - MySQLのスロークエリログファイルを準備
   - ドラッグ&ドロップでファイルをアップロード領域にドロップ
   - または「ファイルを選択」ボタンから複数ファイルを選択
   - 複数ファイルを同時に選択可能（Ctrl+クリックまたはShift+クリック）

2. **データ分析**:
   - アップロード後、自動的に解析が実行される
   - 統計サマリーで全体のパフォーマンス概要を確認
   - 時系列グラフでクエリ実行時間の推移を可視化

3. **詳細分析**:
   - クエリ解析表でパフォーマンス問題のあるクエリを特定
   - 各クエリ行をクリックして詳細なパラメータ分析を表示
   - 同じクエリパターンでも異なるパラメータ値による性能差を分析

4. **ファイル管理**:
   - アップロード済みファイルの一覧表示
   - 不要なファイルは個別に削除可能
   - 「全て削除」で一括削除も可能

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

### 主要コンポーネントの役割

- **`page.tsx`**: メインのUI、ファイルアップロード、データ管理、解析結果表示
- **`slowQueryParser.ts`**: スロークエリログの解析ロジック、クエリ正規化
- **`QueryAnalysisModal.tsx`**: 詳細なパラメータ分析を表示するモーダル
- **`StatsSummary.tsx`**: 全体統計の表示
- **`TimeSeriesChart.tsx`**: Chart.jsを使った時系列グラフ

## デプロイ

### GitHub Pages
このプロジェクトはGitHub Pagesに自動デプロイされています。

**アクセスURL**: [https://ot-nemoto.github.io/slow-query-viewer/](https://ot-nemoto.github.io/slow-query-viewer/)

#### デプロイフロー
1. masterブランチへコードをpush
2. GitHub Actionsが自動実行
3. `npm run build:static`で静的ファイルを生成
4. GitHub Pagesに自動デプロイ

#### ローカルでの静的ビルド確認
```bash
npm run build:static
cd out
python3 -m http.server 8080
# ブラウザで http://localhost:8080 にアクセス
```

## ライセンス

MIT
