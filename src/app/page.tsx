"use client";

import { useState, useId, useEffect } from "react";
import { SlowQueryParser, type SlowQueryEntry } from "@/lib/slowQueryParser";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import StatsSummary from "@/components/StatsSummary";

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
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputId = useId();

  // ページ全体でのドラッグアンドドロップを防ぐ
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  const processFiles = async (fileList: FileList) => {
    setIsLoading(true);
    try {
      const newFiles: UploadedFile[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const content = await file.text();
        const entries = SlowQueryParser.parseLog(content);

        newFiles.push({
          name: file.name,
          size: file.size,
          entries,
        });
      }

      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);

      // 全ファイルのエントリを統合
      const combinedEntries = updatedFiles.flatMap((f) => f.entries);
      updateAnalysis(combinedEntries);
    } catch (error) {
      console.error("Error parsing files:", error);
      alert("ファイルの解析中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    await processFiles(files);
    // ファイル入力をリセット
    event.target.value = "";
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      // .logまたは.txtファイルのみをフィルタリング
      const validFiles = Array.from(files).filter(file =>
        file.name.toLowerCase().endsWith('.log') ||
        file.name.toLowerCase().endsWith('.txt')
      );

      if (validFiles.length === 0) {
        alert("対応していないファイル形式です。.logまたは.txtファイルをアップロードしてください。");
        return;
      }

      if (validFiles.length !== files.length) {
        alert(`${files.length}個のファイルのうち、${validFiles.length}個の有効なファイルをアップロードします。`);
      }

      // FileListを作成するため、DataTransferを使用
      const dataTransfer = new DataTransfer();
      for (const file of validFiles) {
        dataTransfer.items.add(file);
      }

      await processFiles(dataTransfer.files);
    }
  };

  const updateAnalysis = (entries: SlowQueryEntry[]) => {
    const grouped = SlowQueryParser.groupByQuery(entries);

    const summaries: QuerySummary[] = Object.entries(grouped)
      .map(([normalizedQuery, queryEntries]) => {
        const times = queryEntries.map((e) => e.queryTime);
        const totalTime = times.reduce((sum, time) => sum + time, 0);
        return {
          normalizedQuery,
          count: queryEntries.length,
          totalTime,
          avgTime: totalTime / queryEntries.length,
        };
      })
      .sort((a, b) => b.totalTime - a.totalTime);

    setQuerySummaries(summaries);
    setAllEntries(entries);
  };

  const removeFile = (indexToRemove: number) => {
    const updatedFiles = uploadedFiles.filter(
      (_, index) => index !== indexToRemove,
    );
    setUploadedFiles(updatedFiles);

    // 残りのファイルで再解析
    const combinedEntries = updatedFiles.flatMap((f) => f.entries);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          MySQL スロークエリ解析ツール
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            スロークエリログファイルをアップロード
          </h2>

          {/* ドラッグアンドドロップエリア */}
          <label
            htmlFor={fileInputId}
            className={`relative block border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
              isDragOver
                ? "border-blue-500 bg-blue-50 shadow-lg scale-[1.02]"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".log,.txt"
              multiple
              onChange={handleFileUpload}
              disabled={isLoading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id={fileInputId}
            />
            <div className="space-y-4">
              <div className="flex justify-center">
                <svg
                  className={`w-12 h-12 ${
                    isDragOver ? "text-blue-500" : "text-gray-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>アップロードアイコン</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <p className={`text-lg font-medium transition-colors ${
                  isDragOver ? "text-blue-600" : "text-gray-900"
                }`}>
                  {isDragOver ? "📁 ファイルをドロップしてください" : "📁 ファイルをドラッグ＆ドロップ"}
                </p>
                <p className="text-gray-500 mt-1">
                  またはクリックしてファイルを選択してください
                </p>
              </div>
              <div className={`text-sm transition-colors ${
                isDragOver ? "text-blue-500" : "text-gray-500"
              }`}>
                <p>📄 対応ファイル: .log, .txt</p>
                <p>🔢 複数ファイルの同時アップロード可能</p>
                {isDragOver && (
                  <p className="text-blue-600 font-medium mt-2 animate-pulse">
                    ✅ ここにドロップしてください
                  </p>
                )}
              </div>
            </div>
          </label>

          {isLoading && (
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="ml-2 text-blue-600">解析中...</p>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  アップロード済みファイル ({uploadedFiles.length})
                </h3>
                <button
                  type="button"
                  onClick={clearAllFiles}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  全て削除
                </button>
              </div>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{file.name}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB,{" "}
                        {file.entries.length} クエリ)
                      </span>
                    </div>
                    <button
                      type="button"
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

        {uploadedFiles.length > 0 && (
          <div className="mb-8">
            <TimeSeriesChart
              fileData={uploadedFiles.map(file => ({
                name: file.name,
                entries: file.entries
              }))}
            />
          </div>
        )}

        {querySummaries.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <h2 className="text-xl font-semibold p-6 pb-0">クエリ解析結果</h2>
            <p className="px-6 text-gray-600 mb-4">
              {uploadedFiles.length > 1
                ? `${uploadedFiles.length}つのファイルを統合した結果を表示しています。`
                : ""}
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
                    <tr
                      key={`${summary.normalizedQuery}-${summary.count}-${summary.totalTime}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        <div
                          className="max-w-md truncate"
                          title={summary.normalizedQuery}
                        >
                          {summary.normalizedQuery.length > 100
                            ? summary.normalizedQuery.substring(0, 100) + "..."
                            : summary.normalizedQuery}
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
