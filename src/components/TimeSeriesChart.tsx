"use client";

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

interface TimeSeriesChartProps {
  entries: SlowQueryEntry[];
}

export default function TimeSeriesChart({ entries }: TimeSeriesChartProps) {
  // Sort entries by time
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  // Prepare data for chart
  const data = {
    labels: sortedEntries.map((entry) => {
      const date = new Date(entry.time);
      return date.toLocaleString("ja-JP", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }),
    datasets: [
      {
        label: "クエリ実行時間 (秒)",
        data: sortedEntries.map((entry) => entry.queryTime),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "スロークエリ実行時間の時系列変化",
      },
      tooltip: {
        callbacks: {
          afterLabel: (context: { dataIndex: number }) => {
            const entry = sortedEntries[context.dataIndex];
            return [
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
      <Line data={data} options={options} />
    </div>
  );
}
