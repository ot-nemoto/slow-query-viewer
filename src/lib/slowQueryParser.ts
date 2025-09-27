export interface SlowQueryEntry {
  time: string;
  user: string;
  host: string;
  id: string;
  queryTime: number;
  lockTime: number;
  rowsSent: number;
  rowsExamined: number;
  query: string;
  database?: string;
}

export interface ParameterAnalysis {
  parameterPattern: string; // 実際のパラメータ値を含むクエリ
  executions: SlowQueryEntry[]; // このパターンでの実行履歴
  count: number;
  avgTime: number;
  maxTime: number;
  minTime: number;
  totalTime: number;
}

export interface QueryAnalysis {
  normalizedQuery: string;
  parameterAnalyses: ParameterAnalysis[];
  totalExecutions: number;
}

export const SlowQueryParser = {
  parseLog(content: string): SlowQueryEntry[] {
    const entries: SlowQueryEntry[] = [];
    const lines = content.split("\n");

    let currentEntry: Partial<SlowQueryEntry> = {};
    let queryLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and header lines
      if (
        !line ||
        line.startsWith("Tcp port:") ||
        line.startsWith("/rdsdbbin") ||
        line === "Time                 Id Command    Argument"
      ) {
        continue;
      }

      // Parse timestamp
      if (line.startsWith("# Time:")) {
        // If we have a previous entry, save it
        if (currentEntry.time && queryLines.length > 0) {
          currentEntry.query = queryLines.join(" ").trim();
          entries.push(currentEntry as SlowQueryEntry);
        }

        // Start new entry
        currentEntry = {};
        queryLines = [];

        const timeMatch = line.match(/# Time: (.+)/);
        if (timeMatch) {
          currentEntry.time = timeMatch[1];
        }
      }

      // Parse user and host
      else if (line.startsWith("# User@Host:")) {
        const userHostMatch = line.match(
          /# User@Host: (.+?)\[(.+?)\] @ \[(.+?)\]\s+Id: (\d+)/,
        );
        if (userHostMatch) {
          currentEntry.user = userHostMatch[2];
          currentEntry.host = userHostMatch[3];
          currentEntry.id = userHostMatch[4];
        }
      }

      // Parse query metrics
      else if (line.startsWith("# Query_time:")) {
        const metricsMatch = line.match(
          /# Query_time: ([\d.]+)\s+Lock_time: ([\d.]+)\s+Rows_sent: (\d+)\s+Rows_examined: (\d+)/,
        );
        if (metricsMatch) {
          currentEntry.queryTime = parseFloat(metricsMatch[1]);
          currentEntry.lockTime = parseFloat(metricsMatch[2]);
          currentEntry.rowsSent = parseInt(metricsMatch[3], 10);
          currentEntry.rowsExamined = parseInt(metricsMatch[4], 10);
        }
      }

      // Parse database
      else if (line.startsWith("use ") && line.endsWith(";")) {
        const dbMatch = line.match(/use (.+?);/);
        if (dbMatch) {
          currentEntry.database = dbMatch[1];
        }
      }

      // Parse SET timestamp (skip)
      else if (line.startsWith("SET timestamp=")) {
      }

      // Everything else is part of the query
      else if (line && !line.startsWith("#")) {
        queryLines.push(line);
      }
    }

    // Don't forget the last entry
    if (currentEntry.time && queryLines.length > 0) {
      currentEntry.query = queryLines.join(" ").trim();
      entries.push(currentEntry as SlowQueryEntry);
    }

    return entries;
  },

  normalizeQuery(query: string): string {
    // Remove extra whitespace and normalize query for grouping
    return query
      .replace(/\s+/g, " ")
      .replace(/'/g, "'")
      .replace(/"/g, '"')
      .replace(/\d+/g, "?") // Replace numbers with placeholders
      .replace(/'[^']*'/g, "'?'") // Replace string literals
      .replace(/"[^"]*"/g, '"?"') // Replace quoted strings
      .trim();
  },

  groupByQuery(entries: SlowQueryEntry[]): Record<string, SlowQueryEntry[]> {
    const grouped: Record<string, SlowQueryEntry[]> = {};

    entries.forEach((entry) => {
      const normalizedQuery = SlowQueryParser.normalizeQuery(entry.query);
      if (!grouped[normalizedQuery]) {
        grouped[normalizedQuery] = [];
      }
      grouped[normalizedQuery].push(entry);
    });

    return grouped;
  },

  extractActualParameters(originalQuery: string): string {
    // 実際のパラメータ値をそのまま保持（完全に同じ条件での実行を検出するため）
    return originalQuery
      .replace(/\s+/g, " ") // 空白を正規化
      .replace(/'/g, "'") // クォートを正規化
      .replace(/"/g, '"') // ダブルクォートを正規化
      .trim();
  },

  extractParameterPattern(originalQuery: string): string {
    // より細かい分類のためのパターン抽出（元の機能も残す）
    return originalQuery
      .replace(/\s+/g, " ")
      .replace(/'/g, "'")
      .replace(/"/g, '"')
      .replace(/'([^']{0,20})'/g, (_match, content) => {
        // 文字列の長さによって分類
        if (content.length <= 5) return `'SHORT_STR'`;
        if (content.length <= 20) return `'MEDIUM_STR'`;
        return `'LONG_STR'`;
      })
      .replace(/"([^"]{0,20})"/g, (_match, content) => {
        if (content.length <= 5) return `"SHORT_STR"`;
        if (content.length <= 20) return `"MEDIUM_STR"`;
        return `"LONG_STR"`;
      })
      .replace(/\b\d{1,3}\b/g, "SMALL_NUM") // 1-3桁の数値
      .replace(/\b\d{4,9}\b/g, "MEDIUM_NUM") // 4-9桁の数値
      .replace(/\b\d{10,}\b/g, "LARGE_NUM") // 10桁以上の数値
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, "DATE") // 日付パターン
      .replace(/\b\d{2}:\d{2}:\d{2}\b/g, "TIME") // 時刻パターン
      .trim();
  },

  analyzeQueryParameters(
    normalizedQuery: string,
    entries: SlowQueryEntry[],
  ): QueryAnalysis {
    // 実際のパラメータ値（完全に同じ条件）でグループ化
    const actualParameterGroups: Record<string, SlowQueryEntry[]> = {};

    entries.forEach((entry) => {
      const actualParams = SlowQueryParser.extractActualParameters(entry.query);
      if (!actualParameterGroups[actualParams]) {
        actualParameterGroups[actualParams] = [];
      }
      actualParameterGroups[actualParams].push(entry);
    });

    // 各実際のパラメータ値の統計を計算
    const parameterAnalyses: ParameterAnalysis[] = Object.entries(
      actualParameterGroups,
    ).map(([actualQuery, executions]) => {
      const times = executions.map((e) => e.queryTime);
      const totalTime = times.reduce((sum, time) => sum + time, 0);
      const avgTime = totalTime / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      return {
        parameterPattern: actualQuery, // 実際のクエリを表示
        executions,
        count: executions.length,
        avgTime,
        maxTime,
        minTime,
        totalTime,
      };
    });

    // 実行回数の多い順、次に実行時間の長い順でソート
    parameterAnalyses.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count; // 実行回数順
      }
      return b.totalTime - a.totalTime; // 合計実行時間順
    });

    return {
      normalizedQuery,
      parameterAnalyses,
      totalExecutions: entries.length,
    };
  },
};
