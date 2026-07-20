import { describe, expect, it } from "vitest";
import type { SlowQueryEntry } from "./slowQueryParser";
import { SlowQueryParser } from "./slowQueryParser";

const SAMPLE_LOG = `# Time: 2024-01-15T10:30:00.000000Z
# User@Host: appuser[appuser] @ [10.0.0.1]  Id: 12345
# Query_time: 2.500000  Lock_time: 0.000100  Rows_sent: 1  Rows_examined: 50000
SET timestamp=1705312200;
SELECT * FROM users WHERE id = 123;`;

const MULTI_ENTRY_LOG = `# Time: 2024-01-15T10:30:00.000000Z
# User@Host: appuser[appuser] @ [10.0.0.1]  Id: 100
# Query_time: 1.000000  Lock_time: 0.000000  Rows_sent: 10  Rows_examined: 1000
SET timestamp=1705312200;
SELECT * FROM users WHERE id = 1;
# Time: 2024-01-15T10:31:00.000000Z
# User@Host: admin[admin] @ [10.0.0.2]  Id: 200
# Query_time: 3.500000  Lock_time: 0.001000  Rows_sent: 5  Rows_examined: 20000
SET timestamp=1705312260;
SELECT * FROM orders WHERE user_id = 1 AND status = 'active';`;

function makeEntry(overrides: Partial<SlowQueryEntry> = {}): SlowQueryEntry {
  return {
    time: "2024-01-15T10:30:00.000000Z",
    user: "appuser",
    host: "10.0.0.1",
    id: "100",
    queryTime: 1.0,
    lockTime: 0.0,
    rowsSent: 10,
    rowsExamined: 1000,
    query: "SELECT * FROM users WHERE id = 1",
    ...overrides,
  };
}

describe("parseLog", () => {
  it("単一エントリを解析できる", () => {
    const entries = SlowQueryParser.parseLog(SAMPLE_LOG);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      time: "2024-01-15T10:30:00.000000Z",
      user: "appuser",
      host: "10.0.0.1",
      id: "12345",
      queryTime: 2.5,
      lockTime: 0.0001,
      rowsSent: 1,
      rowsExamined: 50000,
      query: "SELECT * FROM users WHERE id = 123;",
    });
  });

  it("複数エントリを解析できる", () => {
    const entries = SlowQueryParser.parseLog(MULTI_ENTRY_LOG);

    expect(entries).toHaveLength(2);
    expect(entries[0].user).toBe("appuser");
    expect(entries[0].queryTime).toBe(1.0);
    expect(entries[1].user).toBe("admin");
    expect(entries[1].queryTime).toBe(3.5);
  });

  it("use 文からデータベース名を抽出する", () => {
    const log = `# Time: 2024-01-15T10:30:00.000000Z
# User@Host: appuser[appuser] @ [10.0.0.1]  Id: 100
# Query_time: 1.000000  Lock_time: 0.000000  Rows_sent: 1  Rows_examined: 100
use mydb;
SET timestamp=1705312200;
SELECT 1;`;

    const entries = SlowQueryParser.parseLog(log);
    expect(entries[0].database).toBe("mydb");
  });

  it("ヘッダー行をスキップする", () => {
    const log = `Tcp port: 3306
/rdsdbbin/oscar/bin/mysqld, Version: 8.0
Time                 Id Command    Argument
# Time: 2024-01-15T10:30:00.000000Z
# User@Host: appuser[appuser] @ [10.0.0.1]  Id: 100
# Query_time: 1.000000  Lock_time: 0.000000  Rows_sent: 1  Rows_examined: 100
SET timestamp=1705312200;
SELECT 1;`;

    const entries = SlowQueryParser.parseLog(log);
    expect(entries).toHaveLength(1);
    expect(entries[0].query).toBe("SELECT 1;");
  });

  it("複数行クエリを結合する", () => {
    const log = `# Time: 2024-01-15T10:30:00.000000Z
# User@Host: appuser[appuser] @ [10.0.0.1]  Id: 100
# Query_time: 1.000000  Lock_time: 0.000000  Rows_sent: 1  Rows_examined: 100
SET timestamp=1705312200;
SELECT *
FROM users
WHERE id = 1;`;

    const entries = SlowQueryParser.parseLog(log);
    expect(entries[0].query).toBe("SELECT * FROM users WHERE id = 1;");
  });

  it("空文字列の場合は空配列を返す", () => {
    expect(SlowQueryParser.parseLog("")).toEqual([]);
  });

  it("クエリのないエントリはスキップされる", () => {
    const log = `# Time: 2024-01-15T10:30:00.000000Z
# User@Host: appuser[appuser] @ [10.0.0.1]  Id: 100
# Query_time: 1.000000  Lock_time: 0.000000  Rows_sent: 0  Rows_examined: 0
# Time: 2024-01-15T10:31:00.000000Z
# User@Host: appuser[appuser] @ [10.0.0.1]  Id: 101
# Query_time: 2.000000  Lock_time: 0.000000  Rows_sent: 1  Rows_examined: 100
SET timestamp=1705312260;
SELECT 1;`;

    const entries = SlowQueryParser.parseLog(log);
    expect(entries).toHaveLength(1);
    expect(entries[0].queryTime).toBe(2.0);
  });
});

describe("normalizeQuery", () => {
  it("数値をプレースホルダに置換する", () => {
    expect(
      SlowQueryParser.normalizeQuery("SELECT * FROM users WHERE id = 123"),
    ).toBe("SELECT * FROM users WHERE id = ?");
  });

  it("文字列リテラルをプレースホルダに置換する", () => {
    expect(
      SlowQueryParser.normalizeQuery("SELECT * FROM users WHERE name = 'John'"),
    ).toBe("SELECT * FROM users WHERE name = '?'");
  });

  it("ダブルクォート文字列をプレースホルダに置換する", () => {
    expect(
      SlowQueryParser.normalizeQuery('SELECT * FROM users WHERE name = "John"'),
    ).toBe('SELECT * FROM users WHERE name = "?"');
  });

  it("複数の空白を1つに正規化する", () => {
    expect(SlowQueryParser.normalizeQuery("SELECT  *   FROM    users")).toBe(
      "SELECT * FROM users",
    );
  });

  it("数値と文字列の両方を含むクエリを正規化する", () => {
    const result = SlowQueryParser.normalizeQuery(
      "SELECT * FROM orders WHERE user_id = 42 AND status = 'active'",
    );
    expect(result).toBe(
      "SELECT * FROM orders WHERE user_id = ? AND status = '?'",
    );
  });
});

describe("groupByQuery", () => {
  it("同じ正規化クエリをグルーピングする", () => {
    const entries = [
      makeEntry({ query: "SELECT * FROM users WHERE id = 1" }),
      makeEntry({ query: "SELECT * FROM users WHERE id = 2" }),
      makeEntry({ query: "SELECT * FROM orders WHERE id = 1" }),
    ];

    const grouped = SlowQueryParser.groupByQuery(entries);
    const keys = Object.keys(grouped);

    expect(keys).toHaveLength(2);
    expect(grouped["SELECT * FROM users WHERE id = ?"]).toHaveLength(2);
    expect(grouped["SELECT * FROM orders WHERE id = ?"]).toHaveLength(1);
  });

  it("空配列の場合は空オブジェクトを返す", () => {
    expect(SlowQueryParser.groupByQuery([])).toEqual({});
  });

  it("入力順序を保持する", () => {
    const entries = [
      makeEntry({ query: "SELECT * FROM users WHERE id = 1", queryTime: 1.0 }),
      makeEntry({ query: "SELECT * FROM users WHERE id = 2", queryTime: 2.0 }),
    ];

    const grouped = SlowQueryParser.groupByQuery(entries);
    const group = grouped["SELECT * FROM users WHERE id = ?"];

    expect(group[0].queryTime).toBe(1.0);
    expect(group[1].queryTime).toBe(2.0);
  });
});

describe("extractActualParameters", () => {
  it("空白を正規化しつつパラメータ値を保持する", () => {
    expect(
      SlowQueryParser.extractActualParameters(
        "SELECT  *  FROM  users  WHERE  id = 123",
      ),
    ).toBe("SELECT * FROM users WHERE id = 123");
  });

  it("パラメータ値をそのまま保持する", () => {
    const query = "SELECT * FROM users WHERE id = 42 AND name = 'John'";
    const result = SlowQueryParser.extractActualParameters(query);
    expect(result).toContain("42");
    expect(result).toContain("John");
  });
});

describe("extractParameterPattern", () => {
  it("数値を桁数で分類する", () => {
    const result = SlowQueryParser.extractParameterPattern(
      "SELECT * FROM users WHERE id = 42 AND org_id = 12345 AND phone = 9012345678",
    );
    expect(result).toContain("SMALL_NUM");
    expect(result).toContain("MEDIUM_NUM");
    expect(result).toContain("LARGE_NUM");
  });

  it("文字列を長さで分類する", () => {
    const result = SlowQueryParser.extractParameterPattern(
      "SELECT * FROM users WHERE code = 'AB' AND name = 'John Doe Smith'",
    );
    expect(result).toContain("'SHORT_STR'");
    expect(result).toContain("'MEDIUM_STR'");
  });

  it("空白を正規化する", () => {
    const result = SlowQueryParser.extractParameterPattern(
      "SELECT  *  FROM  users",
    );
    expect(result).toBe("SELECT * FROM users");
  });
});

describe("analyzeQueryParameters", () => {
  it("パラメータ値別にグルーピングして統計を算出する", () => {
    const entries = [
      makeEntry({ query: "SELECT * FROM users WHERE id = 1", queryTime: 1.0 }),
      makeEntry({ query: "SELECT * FROM users WHERE id = 1", queryTime: 2.0 }),
      makeEntry({ query: "SELECT * FROM users WHERE id = 2", queryTime: 3.0 }),
    ];

    const result = SlowQueryParser.analyzeQueryParameters(
      "SELECT * FROM users WHERE id = ?",
      entries,
    );

    expect(result.normalizedQuery).toBe("SELECT * FROM users WHERE id = ?");
    expect(result.totalExecutions).toBe(3);
    expect(result.parameterAnalyses).toHaveLength(2);
  });

  it("実行回数順にソートする", () => {
    const entries = [
      makeEntry({ query: "SELECT * FROM users WHERE id = 1", queryTime: 1.0 }),
      makeEntry({ query: "SELECT * FROM users WHERE id = 1", queryTime: 2.0 }),
      makeEntry({ query: "SELECT * FROM users WHERE id = 2", queryTime: 5.0 }),
    ];

    const result = SlowQueryParser.analyzeQueryParameters(
      "SELECT * FROM users WHERE id = ?",
      entries,
    );

    expect(result.parameterAnalyses[0].count).toBe(2);
    expect(result.parameterAnalyses[1].count).toBe(1);
  });

  it("同一実行回数の場合は合計時間順にソートする", () => {
    const entries = [
      makeEntry({ query: "SELECT * FROM users WHERE id = 1", queryTime: 1.0 }),
      makeEntry({ query: "SELECT * FROM users WHERE id = 2", queryTime: 5.0 }),
    ];

    const result = SlowQueryParser.analyzeQueryParameters(
      "SELECT * FROM users WHERE id = ?",
      entries,
    );

    expect(result.parameterAnalyses[0].parameterPattern).toContain("id = 2");
    expect(result.parameterAnalyses[1].parameterPattern).toContain("id = 1");
  });

  it("統計値が正しく計算される", () => {
    const entries = [
      makeEntry({ query: "SELECT * FROM users WHERE id = 1", queryTime: 1.0 }),
      makeEntry({ query: "SELECT * FROM users WHERE id = 1", queryTime: 3.0 }),
      makeEntry({ query: "SELECT * FROM users WHERE id = 1", queryTime: 2.0 }),
    ];

    const result = SlowQueryParser.analyzeQueryParameters(
      "SELECT * FROM users WHERE id = ?",
      entries,
    );

    const analysis = result.parameterAnalyses[0];
    expect(analysis.count).toBe(3);
    expect(analysis.totalTime).toBe(6.0);
    expect(analysis.avgTime).toBe(2.0);
    expect(analysis.maxTime).toBe(3.0);
    expect(analysis.minTime).toBe(1.0);
  });

  it("空配列の場合は空の分析結果を返す", () => {
    const result = SlowQueryParser.analyzeQueryParameters(
      "SELECT * FROM users WHERE id = ?",
      [],
    );

    expect(result.totalExecutions).toBe(0);
    expect(result.parameterAnalyses).toHaveLength(0);
  });
});
