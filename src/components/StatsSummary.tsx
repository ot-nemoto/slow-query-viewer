"use client";

import type { SlowQueryEntry } from "@/lib/slowQueryParser";

interface StatsSummaryProps {
  entries: SlowQueryEntry[];
}

export default function StatsSummary({ entries }: StatsSummaryProps) {
  if (entries.length === 0) return null;

  const totalQueries = entries.length;
  const totalTime = entries.reduce((sum, entry) => sum + entry.queryTime, 0);
  const avgTime = totalTime / totalQueries;
  const maxTime = Math.max(...entries.map((e) => e.queryTime));
  const minTime = Math.min(...entries.map((e) => e.queryTime));

  const totalRowsExamined = entries.reduce(
    (sum, entry) => sum + entry.rowsExamined,
    0,
  );
  const avgRowsExamined = totalRowsExamined / totalQueries;

  const slowestQuery = entries.find((e) => e.queryTime === maxTime);
  const timeRange =
    entries.length > 1
      ? {
          start: new Date(
            Math.min(...entries.map((e) => new Date(e.time).getTime())),
          ),
          end: new Date(
            Math.max(...entries.map((e) => new Date(e.time).getTime())),
          ),
        }
      : null;

  const formatTime = (seconds: number) => {
    return seconds.toFixed(3) + "s";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString("ja-JP");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">統計サマリー</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {totalQueries.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">総クエリ数</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {formatTime(totalTime)}
          </div>
          <div className="text-sm text-gray-600">総実行時間</div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {formatTime(avgTime)}
          </div>
          <div className="text-sm text-gray-600">平均実行時間</div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">
            {formatTime(maxTime)}
          </div>
          <div className="text-sm text-gray-600">最大実行時間</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {timeRange && (
          <div>
            <h3 className="font-semibold mb-2">解析期間</h3>
            <div className="text-sm text-gray-600">
              <div>
                <strong>開始:</strong> {formatDate(timeRange.start)}
              </div>
              <div>
                <strong>終了:</strong> {formatDate(timeRange.end)}
              </div>
              <div>
                <strong>期間:</strong>{" "}
                {Math.ceil(
                  (timeRange.end.getTime() - timeRange.start.getTime()) /
                    (1000 * 60 * 60 * 24),
                )}{" "}
                日
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">検索効率</h3>
          <div className="text-sm text-gray-600">
            <div>
              <strong>平均検索行数:</strong>{" "}
              {avgRowsExamined.toFixed(0).toLocaleString()}
            </div>
            <div>
              <strong>最小実行時間:</strong> {formatTime(minTime)}
            </div>
            <div>
              <strong>実行時間範囲:</strong> {formatTime(minTime)} -{" "}
              {formatTime(maxTime)}
            </div>
          </div>
        </div>
      </div>

      {slowestQuery && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg">
          <h3 className="font-semibold mb-2 text-red-800">最も遅いクエリ</h3>
          <div className="text-sm text-gray-700 grid grid-cols-2 gap-4 mb-2">
            <div>
              <strong>実行時間:</strong> {formatTime(slowestQuery.queryTime)}
            </div>
            <div>
              <strong>実行時刻:</strong>{" "}
              {formatDate(new Date(slowestQuery.time))}
            </div>
            <div>
              <strong>ユーザー:</strong> {slowestQuery.user}
            </div>
            <div>
              <strong>検索行数:</strong>{" "}
              {slowestQuery.rowsExamined.toLocaleString()}
            </div>
          </div>
          <div className="mt-2">
            <strong>クエリ:</strong>
            <pre className="text-xs font-mono bg-white p-2 rounded mt-1 whitespace-pre-wrap max-h-24 overflow-y-auto">
              {slowestQuery.query}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
