import type { QueryAnalysis } from "@/lib/slowQueryParser";

const generateStableKey = (str: string, count: number): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `${Math.abs(hash)}-${count}`;
};

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-background max-w-6xl w-full max-h-[90vh] overflow-hidden"
        style={{ boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)" }}
      >
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 className="text-[25px] font-bold text-text-primary">
              クエリパラメータ分析
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              総実行回数: {analysis.totalExecutions}、パターン数:{" "}
              {analysis.parameterAnalyses.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion focus-visible:ring-offset-2"
            type="button"
            aria-label="モーダルを閉じる"
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

        <div className="p-6 border-b border-border bg-surface-warm">
          <h3 className="text-sm font-bold text-text-secondary mb-2">
            正規化されたクエリ:
          </h3>
          <div className="bg-background border border-border p-3 font-mono text-sm text-text-primary max-h-20 overflow-y-auto">
            {analysis.normalizedQuery}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-[14.688px] font-bold text-text-primary mb-4">
              実際のパラメータ値別分析
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              同じパラメータ値でのクエリ実行をグループ化して表示しています。実行回数が多い順に並んでいます。
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-warm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                      実際のクエリ（パラメータ値）
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                      実行回数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                      平均実行時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                      最大実行時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                      最小実行時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                      合計実行時間
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {analysis.parameterAnalyses.map((paramAnalysis) => (
                    <tr
                      key={generateStableKey(
                        paramAnalysis.parameterPattern,
                        paramAnalysis.count,
                      )}
                      className="hover:bg-surface-warm"
                    >
                      <td className="px-6 py-4 text-sm text-text-primary font-mono">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border border-vermillion text-vermillion">
                          {paramAnalysis.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {paramAnalysis.avgTime.toFixed(3)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-danger font-bold">
                        {paramAnalysis.maxTime.toFixed(3)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-success">
                        {paramAnalysis.minTime.toFixed(3)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {paramAnalysis.totalTime.toFixed(3)}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {analysis.parameterAnalyses.length === 0 && (
              <div className="text-center py-8 text-text-secondary">
                実行されたクエリが見つかりませんでした
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-surface-warm flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-vermillion text-white rounded-full font-bold hover:bg-vermillion-dark transition-colors"
            style={{ fontFeatureSettings: '"palt" 1', letterSpacing: "0.1em" }}
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
