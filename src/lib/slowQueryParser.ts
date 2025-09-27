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

export class SlowQueryParser {
  static parseLog(content: string): SlowQueryEntry[] {
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
          currentEntry.rowsSent = parseInt(metricsMatch[3]);
          currentEntry.rowsExamined = parseInt(metricsMatch[4]);
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
  }

  static normalizeQuery(query: string): string {
    // Remove extra whitespace and normalize query for grouping
    return query
      .replace(/\s+/g, " ")
      .replace(/'/g, "'")
      .replace(/"/g, '"')
      .replace(/\d+/g, "?") // Replace numbers with placeholders
      .replace(/'[^']*'/g, "'?'") // Replace string literals
      .replace(/"[^"]*"/g, '"?"') // Replace quoted strings
      .trim();
  }

  static groupByQuery(
    entries: SlowQueryEntry[],
  ): Record<string, SlowQueryEntry[]> {
    const grouped: Record<string, SlowQueryEntry[]> = {};

    entries.forEach((entry) => {
      const normalizedQuery = SlowQueryParser.normalizeQuery(entry.query);
      if (!grouped[normalizedQuery]) {
        grouped[normalizedQuery] = [];
      }
      grouped[normalizedQuery].push(entry);
    });

    return grouped;
  }
}
