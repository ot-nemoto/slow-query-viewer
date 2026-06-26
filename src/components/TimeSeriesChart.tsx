"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useState } from "react";
import { Line } from "react-chartjs-2";
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
  const [visibleFiles, setVisibleFiles] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      for (const file of fileData) {
        initial[file.name] = true;
      }
      return initial;
    },
  );

  const colors = [
    { border: "#c73120", bg: "rgba(199, 49, 32, 0.1)" },
    { border: "#2e7d4f", bg: "rgba(46, 125, 79, 0.1)" },
    { border: "#d97a00", bg: "rgba(217, 122, 0, 0.1)" },
    { border: "#666666", bg: "rgba(102, 102, 102, 0.1)" },
    { border: "#a52819", bg: "rgba(165, 40, 25, 0.1)" },
    { border: "#262626", bg: "rgba(38, 38, 38, 0.1)" },
  ];

  const timeToDataMap = new Map<string, Map<string, number>>();
  const allTimePoints = new Set<string>();

  fileData.forEach((file) => {
    const fileMap = new Map<string, number>();
    file.entries.forEach((entry) => {
      const timeKey = entry.time;
      allTimePoints.add(timeKey);
      fileMap.set(timeKey, entry.queryTime);
    });
    timeToDataMap.set(file.name, fileMap);
  });

  const sortedTimePoints = Array.from(allTimePoints).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  const datasets = fileData
    .map((file, originalIndex) => {
      if (!visibleFiles[file.name]) return null;

      const color = colors[originalIndex % colors.length];
      const fileDataMap = timeToDataMap.get(file.name);

      return {
        label: file.name,
        data: sortedTimePoints.map(
          (timePoint) => fileDataMap?.get(timePoint) ?? null,
        ),
        borderColor: color.border,
        backgroundColor: color.bg,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 6,
        spanGaps: false,
      };
    })
    .filter((dataset) => dataset !== null);

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
    setVisibleFiles((prev) => ({
      ...prev,
      [fileName]: !prev[fileName],
    }));
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        display: false,
      },
      title: {
        display: true,
        text: "スロークエリ実行時間の時系列変化",
        font: {
          family: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
          weight: 700 as const,
        },
        color: "#262626",
      },
      tooltip: {
        callbacks: {
          afterLabel: (context: {
            dataIndex: number;
            datasetIndex: number;
          }) => {
            const timePoint = sortedTimePoints[context.dataIndex];
            const fileName = datasets[context.datasetIndex]?.label;

            if (!fileName) return [];

            const file = fileData.find((f) => f.name === fileName);
            const entry = file?.entries.find((e) => e.time === timePoint);

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
          color: "#666666",
        },
        ticks: {
          color: "#666666",
        },
        grid: {
          color: "#dddddd",
        },
      },
      x: {
        title: {
          display: true,
          text: "時刻",
          color: "#666666",
        },
        ticks: {
          color: "#666666",
        },
        grid: {
          color: "#dddddd",
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
  };

  return (
    <div className="bg-background p-6">
      {fileData.length > 1 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-text-secondary mb-2">
            表示ファイル
          </h3>
          <div className="flex flex-wrap gap-2">
            {fileData.map((file, index) => {
              const color = colors[index % colors.length];
              const isVisible = visibleFiles[file.name];

              return (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => toggleFileVisibility(file.name)}
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold transition-colors border ${
                    isVisible
                      ? "bg-surface-warm text-text-primary"
                      : "bg-background text-text-secondary border-border"
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
                  <span className="text-xs">({file.entries.length})</span>
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
