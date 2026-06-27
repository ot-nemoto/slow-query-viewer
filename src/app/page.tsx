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

    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  };

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

      if (failedFiles.length > 0) {
        const isAllFailed = failedFiles.length === fileList.length;
        const title = isAllFailed
          ? "すべてのファイルの処理に失敗しました"
          : "一部のファイルの処理に失敗しました";
        const message = failedFiles.join("\n");
        addNotification(isAllFailed ? "error" : "warning", title, message);
      }

      if (newFiles.length > 0) {
        const updatedFiles = [...uploadedFiles, ...newFiles];
        setUploadedFiles(updatedFiles);

        const combinedEntries = updatedFiles.flatMap((f) => f.entries);
        updateAnalysis(combinedEntries);

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
    const groupedEntries = SlowQueryParser.groupByQuery(allEntries);
    const entries = groupedEntries[normalizedQuery] || [];

    const analysis = SlowQueryParser.analyzeQueryParameters(
      normalizedQuery,
      entries,
    );

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
    <div className="min-h-screen p-8 bg-surface-warm">
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />

      <div className="max-w-[1100px] mx-auto px-6">
        <h1 className="text-[25px] font-bold text-text-primary mb-12">
          MySQL スロークエリ解析ツール
        </h1>

        <div className="bg-background p-6 mb-12">
          <h2 className="text-[25px] font-bold text-text-primary mb-4">
            スロークエリログファイルをアップロード
          </h2>

          <label
            htmlFor={fileInputId}
            className={`relative block border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
              isDragOver
                ? "border-vermillion bg-surface-deep"
                : "border-border hover:border-text-secondary hover:bg-surface-warm"
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
                    isDragOver ? "text-vermillion" : "text-text-secondary"
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
                  className={`text-[14.688px] font-bold transition-colors ${
                    isDragOver ? "text-vermillion" : "text-text-primary"
                  }`}
                >
                  {isDragOver
                    ? "ファイルをドロップしてください"
                    : "ファイルをドラッグ＆ドロップ"}
                </p>
                <p className="text-text-secondary mt-1">
                  またはクリックしてファイルを選択してください
                </p>
              </div>
              <div
                className={`text-sm transition-colors ${
                  isDragOver ? "text-vermillion" : "text-text-secondary"
                }`}
              >
                <p>対応ファイル: すべてのファイル形式</p>
                <p>複数ファイルの同時アップロード可能</p>
                {isDragOver && (
                  <p className="text-vermillion font-bold mt-2 animate-pulse">
                    ここにドロップしてください
                  </p>
                )}
              </div>
            </div>
          </label>

          {isLoading && (
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-vermillion"></div>
              <p className="ml-2 text-vermillion">解析中...</p>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[14.688px] font-bold">
                  アップロード済みファイル ({uploadedFiles.length})
                </h3>
                <button
                  type="button"
                  onClick={clearAllFiles}
                  className="px-4 py-1.5 text-sm font-bold text-vermillion border border-vermillion rounded-full hover:bg-surface-deep transition-colors"
                >
                  全て削除
                </button>
              </div>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="flex items-center justify-between p-3 bg-surface-warm"
                  >
                    <div className="flex-1">
                      <span className="font-bold">{file.name}</span>
                      <span className="ml-2 text-sm text-text-secondary">
                        ({(file.size / 1024).toFixed(1)} KB,{" "}
                        {file.entries.length} クエリ)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 px-3 py-1 text-sm text-vermillion hover:bg-surface-deep rounded-full transition-colors"
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
          <div className="mb-12">
            <TimeSeriesChart
              fileData={uploadedFiles.map((file) => ({
                name: file.name,
                entries: file.entries,
              }))}
            />
          </div>
        )}

        {querySummaries.length > 0 && (
          <div className="bg-background overflow-hidden mb-12">
            <h2 className="text-[25px] font-bold p-6 pb-0 text-text-primary">
              クエリ解析結果
            </h2>
            <p className="px-6 text-text-secondary mb-4">
              {uploadedFiles.length > 1
                ? `${uploadedFiles.length}つのファイルを統合した結果を表示しています。`
                : ""}
              列ヘッダーをクリックでソートできます
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-warm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                      クエリ（正規化済み）
                    </th>
                    {(
                      [
                        ["count", "実行回数"],
                        ["totalTime", "総実行時間"],
                        ["avgTime", "平均実行時間"],
                        ["maxTime", "最大実行時間"],
                        ["minTime", "最小実行時間"],
                      ] as [SortKey, string][]
                    ).map(([key, label]) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider"
                        aria-sort={
                          sortKey === key
                            ? sortDirection === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <button
                          type="button"
                          className="flex items-center space-x-1 hover:bg-surface-deep select-none w-full"
                          onClick={() => handleSort(key)}
                        >
                          <span>{label}</span>
                          {sortKey === key && (
                            <span className="text-vermillion">
                              {sortDirection === "desc" ? "↓" : "↑"}
                            </span>
                          )}
                        </button>
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                      分析
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {querySummaries.slice(0, 20).map((summary) => (
                    <tr
                      key={`${summary.normalizedQuery}-${summary.count}-${summary.totalTime}`}
                      className="hover:bg-surface-warm"
                    >
                      <td className="px-6 py-4 text-sm text-text-primary font-mono">
                        <div
                          className="max-w-md truncate"
                          title={summary.normalizedQuery}
                        >
                          {summary.normalizedQuery.length > 100
                            ? `${summary.normalizedQuery.substring(0, 100)}...`
                            : summary.normalizedQuery}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {summary.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {summary.totalTime.toFixed(3)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {summary.avgTime.toFixed(3)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-danger font-bold">
                          {summary.maxTime.toFixed(3)}s
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-success">
                          {summary.minTime.toFixed(3)}s
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() =>
                            handleAnalyzeQuery(summary.normalizedQuery)
                          }
                          className="inline-flex items-center px-4 py-1.5 text-xs font-bold rounded-full text-white bg-vermillion hover:bg-vermillion-dark transition-colors"
                          style={{ fontFeatureSettings: '"palt" 1', letterSpacing: "0.1em" }}
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

        <QueryAnalysisModal
          isOpen={analysisModal.isOpen}
          onClose={closeAnalysisModal}
          analysis={analysisModal.analysis}
        />
      </div>
    </div>
  );
}
