import type { QueryAnalysis } from "@/lib/slowQueryParser";

interface QueryAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: QueryAnalysis | null;
}

const QueryAnalysisModal: React.FC<QueryAnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
}) => {
  if (!isOpen || !analysis) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              クエリパラメータ分析
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              総実行回数: {analysis.totalExecutions}、パターン数:{" "}
              {analysis.parameterAnalyses.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>閉じる</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 正規化されたクエリ */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            正規化されたクエリ:
          </h3>
          <div className="bg-white border border-gray-300 rounded p-3 font-mono text-sm text-gray-800 max-h-20 overflow-y-auto">
            {analysis.normalizedQuery}
          </div>
        </div>

        {/* パラメータ分析結果 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              実際のパラメータ値別分析
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              同じパラメータ値でのクエリ実行をグループ化して表示しています。実行回数が多い順に並んでいます。
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      実際のクエリ（パラメータ値）
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      実行回数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      平均実行時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最大実行時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最小実行時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      合計実行時間
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysis.parameterAnalyses.map((paramAnalysis) => (
                    <tr
                      key={`${paramAnalysis.parameterPattern}-${paramAnalysis.count}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        <div className="max-w-md">
                          <div
                            className="truncate cursor-help"
                            title={paramAnalysis.parameterPattern}
                          >
                            {paramAnalysis.parameterPattern.length > 80
                              ? `${paramAnalysis.parameterPattern.substring(0, 80)}...`
                              : paramAnalysis.parameterPattern}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {paramAnalysis.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {paramAnalysis.avgTime.toFixed(3)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {paramAnalysis.maxTime.toFixed(3)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {paramAnalysis.minTime.toFixed(3)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {paramAnalysis.totalTime.toFixed(3)}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {analysis.parameterAnalyses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                実行されたクエリが見つかりませんでした
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            type="button"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default QueryAnalysisModal;
