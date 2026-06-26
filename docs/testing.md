# テスト方針

## テスト種別

| 種別 | 対象 | ツール | 必須 |
|------|------|--------|------|
| ユニットテスト | `lib/` 配下のユーティリティ関数 | Vitest | はい |
| ユニットテスト | API ルート | Vitest | はい（該当する場合） |
| コンポーネントテスト | UI コンポーネント | - | いいえ |
| E2E テスト | ユーザーフロー全体 | 未定 | いいえ |

## 完了条件

- **API ルートの実装はユニットテストの作成をもって完了とする**
- **`lib/` 配下のユーティリティ関数もユニットテストの作成をもって完了とする**
- UI コンポーネントのユニットテストは必須としない
- UI を含む実装は手動動作確認をもって完了とする

## カバレッジ方針

### 必須テスト対象

- `src/lib/slowQueryParser.ts`
  - `parseLog()`: 各種ログ形式の解析
  - `normalizeQuery()`: クエリ正規化
  - `groupByQuery()`: グルーピングロジック
  - `analyzeQueryParameters()`: パラメータ抽出・分析

### テスト不要

- UI コンポーネント（`src/components/`）
- ページコンポーネント（`src/app/page.tsx`）

## 実行手順

```bash
npm run test
```

## 現状

- テストフレームワーク: Vitest
- `npm run test` で `vitest run` を実行
- `src/lib/slowQueryParser.test.ts`: 22 テスト
