"use client";

import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { SlowQueryEntry } from "@/lib/slowQueryParser";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface FileData {
  name: string;
  entries: SlowQueryEntry[];
}

interface TimeSeriesChartProps {
  fileData: FileData[];
}

export default function TimeSeriesChart({ fileData }: TimeSeriesChartProps) {
  // ファイルごとの表示/非表示を管理する状態
  const [visibleFiles, setVisibleFiles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const file of fileData) {
      initial[file.name] = true;
    }
    return initial;
  });

  // 色のパレット（ファイル数に応じて自動で色分け）
  const colors = [
    { border: "rgb(59, 130, 246)", bg: "rgba(59, 130, 246, 0.1)" }, // blue
    { border: "rgb(239, 68, 68)", bg: "rgba(239, 68, 68, 0.1)" }, // red
    { border: "rgb(34, 197, 94)", bg: "rgba(34, 197, 94, 0.1)" }, // green
    { border: "rgb(168, 85, 247)", bg: "rgba(168, 85, 247, 0.1)" }, // purple
    { border: "rgb(245, 158, 11)", bg: "rgba(245, 158, 11, 0.1)" }, // amber
    { border: "rgb(236, 72, 153)", bg: "rgba(236, 72, 153, 0.1)" }, // pink
    { border: "rgb(20, 184, 166)", bg: "rgba(20, 184, 166, 0.1)" }, // teal
    { border: "rgb(251, 113, 133)", bg: "rgba(251, 113, 133, 0.1)" }, // rose
  ];

  // 各ファイルのデータポイントを時刻でマッピング
  const timeToDataMap = new Map<string, Map<string, number>>();
  const allTimePoints = new Set<string>();

  // 全ファイルの時刻とデータを収集
  fileData.forEach(file => {
    const fileMap = new Map<string, number>();
    file.entries.forEach(entry => {
      const timeKey = entry.time;
      allTimePoints.add(timeKey);
      fileMap.set(timeKey, entry.queryTime);
    });
    timeToDataMap.set(file.name, fileMap);
  });

  // 時刻順にソート
  const sortedTimePoints = Array.from(allTimePoints).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // データセットをファイルごとに作成（各ファイルに固定の色インデックスを使用）
  const datasets = fileData
    .map((file, originalIndex) => {
      // ファイルが非表示の場合はスキップ
      if (!visibleFiles[file.name]) return null;

      const color = colors[originalIndex % colors.length];
      const fileDataMap = timeToDataMap.get(file.name);

      return {
        label: file.name,
        data: sortedTimePoints.map(timePoint =>
          fileDataMap?.get(timePoint) ?? null
        ),
        borderColor: color.border,
        backgroundColor: color.bg,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 6,
        spanGaps: false, // null値の部分で線を切る
      };
    })
    .filter(dataset => dataset !== null); // null要素を除去

  const data = {
    labels: sortedTimePoints.map((timePoint) => {
      const date = new Date(timePoint);
      return date.toLocaleString("ja-JP", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }),
    datasets,
  };

  const toggleFileVisibility = (fileName: string) => {
    setVisibleFiles(prev => ({
      ...prev,
      [fileName]: !prev[fileName]
    }));
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        display: false, // 独自の凡例を作るため非表示
      },
      title: {
        display: true,
        text: "スロークエリ実行時間の時系列変化",
      },
      tooltip: {
        callbacks: {
          afterLabel: (context: { dataIndex: number; datasetIndex: number }) => {
            const timePoint = sortedTimePoints[context.dataIndex];
            const fileName = datasets[context.datasetIndex]?.label;

            if (!fileName) return [];

            // 該当ファイルから該当時刻のエントリを探す
            const file = fileData.find(f => f.name === fileName);
            const entry = file?.entries.find(e => e.time === timePoint);

            if (!entry) return [];

            return [
              `ファイル: ${fileName}`,
              `実行時刻: ${new Date(entry.time).toLocaleString("ja-JP")}`,
              `ユーザー: ${entry.user}`,
              `検索行数: ${entry.rowsExamined.toLocaleString()}`,
              `送信行数: ${entry.rowsSent.toLocaleString()}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "実行時間 (秒)",
        },
      },
      x: {
        title: {
          display: true,
          text: "時刻",
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* ファイル別の表示切り替えボタン */}
      {fileData.length > 1 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">表示ファイル</h3>
          <div className="flex flex-wrap gap-2">
            {fileData.map((file, index) => {
              const color = colors[index % colors.length];
              const isVisible = visibleFiles[file.name];

              return (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => toggleFileVisibility(file.name)}
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    isVisible
                      ? "bg-gray-100 text-gray-900 border-2"
                      : "bg-gray-50 text-gray-500 border-2 border-gray-200"
                  }`}
                  style={{
                    borderColor: isVisible ? color.border : undefined,
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color.border }}
                  />
                  {file.name}
                  <span className="text-xs">
                    ({file.entries.length})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Line data={data} options={options} />
    </div>
  );
}
