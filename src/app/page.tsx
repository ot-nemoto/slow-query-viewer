'use client';

import { useState } from 'react';
import { SlowQueryParser, SlowQueryEntry } from '@/lib/slowQueryParser';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import StatsSummary from '@/components/StatsSummary';

interface QuerySummary {
  normalizedQuery: string;
  count: number;
  totalTime: number;
  avgTime: number;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [querySummaries, setQuerySummaries] = useState<QuerySummary[]>([]);
  const [allEntries, setAllEntries] = useState<SlowQueryEntry[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const content = await file.text();
      const entries = SlowQueryParser.parseLog(content);
      const grouped = SlowQueryParser.groupByQuery(entries);

      const summaries: QuerySummary[] = Object.entries(grouped).map(([normalizedQuery, queryEntries]) => {
        const times = queryEntries.map(e => e.queryTime);
        const totalTime = times.reduce((sum, time) => sum + time, 0);
        return {
          normalizedQuery,
          count: queryEntries.length,
          totalTime,
          avgTime: totalTime / queryEntries.length
        };
      }).sort((a, b) => b.totalTime - a.totalTime);

      setQuerySummaries(summaries);
      setAllEntries(entries);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('ファイルの解析中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">MySQL スロークエリ解析ツール</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">スロークエリログファイルをアップロード</h2>
          <input
            type="file"
            accept=".log,.txt"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {isLoading && <p className="mt-2 text-blue-600">解析中...</p>}
        </div>

        <StatsSummary entries={allEntries} />

        {allEntries.length > 0 && (
          <div className="mb-8">
            <TimeSeriesChart entries={allEntries} />
          </div>
        )}

        {querySummaries.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <h2 className="text-xl font-semibold p-6 pb-0">クエリ解析結果</h2>
            <p className="px-6 text-gray-600 mb-4">総実行時間の高い順に表示されています</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      クエリ（正規化済み）
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      実行回数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      総実行時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      平均実行時間
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {querySummaries.slice(0, 20).map((summary, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        <div className="max-w-md truncate" title={summary.normalizedQuery}>
                          {summary.normalizedQuery.length > 100 ? summary.normalizedQuery.substring(0, 100) + '...' : summary.normalizedQuery}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {summary.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {summary.totalTime.toFixed(3)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {summary.avgTime.toFixed(3)}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
