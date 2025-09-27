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

interface UploadedFile {
  name: string;
  size: number;
  entries: SlowQueryEntry[];
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [querySummaries, setQuerySummaries] = useState<QuerySummary[]>([]);
  const [allEntries, setAllEntries] = useState<SlowQueryEntry[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    try {
      const newFiles: UploadedFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await file.text();
        const entries = SlowQueryParser.parseLog(content);

        newFiles.push({
          name: file.name,
          size: file.size,
          entries
        });
      }

      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);

      // 全ファイルのエントリを統合
      const combinedEntries = updatedFiles.flatMap(f => f.entries);
      updateAnalysis(combinedEntries);

    } catch (error) {
      console.error('Error parsing files:', error);
      alert('ファイルの解析中にエラーが発生しました');
    } finally {
      setIsLoading(false);
      // ファイル入力をリセット
      event.target.value = '';
    }
  };

  const updateAnalysis = (entries: SlowQueryEntry[]) => {
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
  };

  const removeFile = (indexToRemove: number) => {
    const updatedFiles = uploadedFiles.filter((_, index) => index !== indexToRemove);
    setUploadedFiles(updatedFiles);

    // 残りのファイルで再解析
    const combinedEntries = updatedFiles.flatMap(f => f.entries);
    if (combinedEntries.length > 0) {
      updateAnalysis(combinedEntries);
    } else {
      setQuerySummaries([]);
      setAllEntries([]);
    }
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setQuerySummaries([]);
    setAllEntries([]);
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
            multiple
            onChange={handleFileUpload}
            disabled={isLoading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="mt-2 text-sm text-gray-600">複数のファイルを同時に選択できます</p>
          {isLoading && <p className="mt-2 text-blue-600">解析中...</p>}

          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">アップロード済みファイル ({uploadedFiles.length})</h3>
                <button
                  onClick={clearAllFiles}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  全て削除
                </button>
              </div>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={`${file.name}-${file.size}`} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <span className="font-medium">{file.name}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB, {file.entries.length} クエリ)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="ml-2 px-2 py-1 text-sm text-red-600 hover:bg-red-100 rounded"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            <p className="px-6 text-gray-600 mb-4">
              {uploadedFiles.length > 1 ?
                `${uploadedFiles.length}つのファイルを統合した結果を表示しています。` :
                ''
              }
              総実行時間の高い順に表示されています
            </p>
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
                  {querySummaries.slice(0, 20).map((summary) => (
                    <tr key={`${summary.normalizedQuery}-${summary.count}-${summary.totalTime}`} className="hover:bg-gray-50">
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
