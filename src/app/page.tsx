"use client";

import { useEffect, useId, useState } from "react";
import NotificationContainer from "@/components/NotificationContainer";
import type { ErrorNotification } from "@/components/NotificationToast";
import QueryAnalysisModal from "@/components/QueryAnalysisModal";
import StatsSummary from "@/components/StatsSummary";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import {
  type QueryAnalysis,
  type SlowQueryEntry,
  SlowQueryParser,
} from "@/lib/slowQueryParser";

interface QuerySummary {
  normalizedQuery: string;
  count: number;
  totalTime: number;
  avgTime: number;
  maxTime: number;
  minTime: number;
}

interface UploadedFile {
  name: string;
  size: number;
  entries: SlowQueryEntry[];
}

type SortKey = "count" | "totalTime" | "avgTime" | "maxTime" | "minTime";
type SortDirection = "asc" | "desc";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [querySummaries, setQuerySummaries] = useState<QuerySummary[]>([]);
  const [allEntries, setAllEntries] = useState<SlowQueryEntry[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("totalTime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [analysisModal, setAnalysisModal] = useState<{
    isOpen: boolean;
    analysis: QueryAnalysis | null;
  }>({
    isOpen: false,
    analysis: null,
  });
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);
  const fileInputId = useId();

  // 通知を追加する関数
  const addNotification = (
    type: ErrorNotification["type"],
    title: string,
    message: string,
  ) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification: ErrorNotification = {
      id,
      type,
      title,
      message,
      timestamp: Date.now(),
    };

    setNotifications((prev) => [...prev, notification]);

    // 5秒後に自動削除
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  // 通知を削除する関数
  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  };

  // ページ全体でのドラッグアンドドロップを防ぐ
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  const processFiles = async (fileList: FileList) => {
    setIsLoading(true);
    try {
      const newFiles: UploadedFile[] = [];
      const failedFiles: string[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        try {
          const content = await file.text();
          const entries = SlowQueryParser.parseLog(content);

          // スロークエリエントリが見つからない場合はエラー扱い
          if (entries.length === 0) {
            failedFiles.push(
              `${file.name} (スロークエリが見つかりませんでした)`,
            );
            continue;
          }

          newFiles.push({
            name: file.name,
            size: file.size,
            entries,
          });
        } catch (error) {
          console.error(`Error parsing file ${file.name}:`, error);
          failedFiles.push(`${file.name} (ファイル読み込みエラー)`);
        }
      }

      // 失敗したファイルがある場合はメッセージを表示
      if (failedFiles.length > 0) {
        const isAllFailed = failedFiles.length === fileList.length;
        const title = isAllFailed
          ? "すべてのファイルの処理に失敗しました"
          : "一部のファイルの処理に失敗しました";
        const message = failedFiles.join("\n");
        addNotification(isAllFailed ? "error" : "warning", title, message);
      }

      // 成功したファイルがある場合のみ処理を続行
      if (newFiles.length > 0) {
        const updatedFiles = [...uploadedFiles, ...newFiles];
        setUploadedFiles(updatedFiles);

        // 全ファイルのエントリを統合
        const combinedEntries = updatedFiles.flatMap((f) => f.entries);
        updateAnalysis(combinedEntries);

        // 成功メッセージを表示
        const totalEntries = newFiles.reduce(
          (sum, file) => sum + file.entries.length,
          0,
        );
        addNotification(
          "success",
          "ファイル読み込み完了",
          `${newFiles.length}個のファイルから${totalEntries}件のスロークエリを読み込みました`,
        );
      }
    } catch (error) {
      console.error("Error parsing files:", error);
      addNotification(
        "error",
        "解析エラー",
        "ファイルの解析中に予期しないエラーが発生しました",
      );
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
      await processFiles(files);
    }
  };

  const updateAnalysis = (entries: SlowQueryEntry[]) => {
    const grouped = SlowQueryParser.groupByQuery(entries);

    const summaries: QuerySummary[] = Object.entries(grouped).map(
      ([normalizedQuery, queryEntries]) => {
        const times = queryEntries.map((e) => e.queryTime);
        const totalTime = times.reduce((sum, time) => sum + time, 0);
        const maxTime = times.reduce(
          (max, time) => Math.max(max, time),
          -Infinity,
        );
        const minTime = times.reduce(
          (min, time) => Math.min(min, time),
          Infinity,
        );
        return {
          normalizedQuery,
          count: queryEntries.length,
          totalTime,
          avgTime: totalTime / queryEntries.length,
          maxTime,
          minTime,
        };
      },
    );

    // ソート適用
    const sortedSummaries = sortSummaries(summaries, sortKey, sortDirection);
    setQuerySummaries(sortedSummaries);
    setAllEntries(entries);
  };

  const sortSummaries = (
    summaries: QuerySummary[],
    key: SortKey,
    direction: SortDirection,
  ): QuerySummary[] => {
    return [...summaries].sort((a, b) => {
      const valueA = a[key];
      const valueB = b[key];

      if (direction === "asc") {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });
  };

  const handleSort = (key: SortKey) => {
    const newDirection =
      sortKey === key && sortDirection === "desc" ? "asc" : "desc";
    setSortKey(key);
    setSortDirection(newDirection);

    const sortedSummaries = sortSummaries(querySummaries, key, newDirection);
    setQuerySummaries(sortedSummaries);
  };

  const handleAnalyzeQuery = (normalizedQuery: string) => {
    // 該当するクエリのエントリを取得
    const groupedEntries = SlowQueryParser.groupByQuery(allEntries);
    const entries = groupedEntries[normalizedQuery] || [];

    // パラメータ分析を実行
    const analysis = SlowQueryParser.analyzeQueryParameters(
      normalizedQuery,
      entries,
    );

    // モーダルを表示
    setAnalysisModal({
      isOpen: true,
      analysis,
    });
  };

  const closeAnalysisModal = () => {
    setAnalysisModal({
      isOpen: false,
      analysis: null,
    });
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
      {/* 通知システム */}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />

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
                <p
                  className={`text-lg font-medium transition-colors ${
                    isDragOver ? "text-blue-600" : "text-gray-900"
                  }`}
                >
                  {isDragOver
                    ? "📁 ファイルをドロップしてください"
                    : "📁 ファイルをドラッグ＆ドロップ"}
                </p>
                <p className="text-gray-500 mt-1">
                  またはクリックしてファイルを選択してください
                </p>
              </div>
              <div
                className={`text-sm transition-colors ${
                  isDragOver ? "text-blue-500" : "text-gray-500"
                }`}
              >
                <p>📄 対応ファイル: すべてのファイル形式</p>
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
              fileData={uploadedFiles.map((file) => ({
                name: file.name,
                entries: file.entries,
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
              列ヘッダーをクリックでソートできます
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      クエリ（正規化済み）
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort("count")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>実行回数</span>
                        {sortKey === "count" && (
                          <span className="text-blue-500">
                            {sortDirection === "desc" ? "↓" : "↑"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort("totalTime")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>総実行時間</span>
                        {sortKey === "totalTime" && (
                          <span className="text-blue-500">
                            {sortDirection === "desc" ? "↓" : "↑"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort("avgTime")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>平均実行時間</span>
                        {sortKey === "avgTime" && (
                          <span className="text-blue-500">
                            {sortDirection === "desc" ? "↓" : "↑"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort("maxTime")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>最大実行時間</span>
                        {sortKey === "maxTime" && (
                          <span className="text-blue-500">
                            {sortDirection === "desc" ? "↓" : "↑"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort("minTime")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>最小実行時間</span>
                        {sortKey === "minTime" && (
                          <span className="text-blue-500">
                            {sortDirection === "desc" ? "↓" : "↑"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分析
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
                            ? `${summary.normalizedQuery.substring(0, 100)}...`
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="text-red-600 font-medium">
                          {summary.maxTime.toFixed(3)}s
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="text-green-600">
                          {summary.minTime.toFixed(3)}s
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() =>
                            handleAnalyzeQuery(summary.normalizedQuery)
                          }
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          type="button"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <title>分析</title>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          分析
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 分析モーダル */}
        <QueryAnalysisModal
          isOpen={analysisModal.isOpen}
          onClose={closeAnalysisModal}
          analysis={analysisModal.analysis}
        />
      </div>
    </div>
  );
}
