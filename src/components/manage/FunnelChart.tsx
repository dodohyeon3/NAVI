/**
 * 학습 퍼널 시각화 — 각 단계의 사용자 수와 전환율 표시
 */

interface FunnelStep {
  label:       string
  event:       string
  count:       number
  prev?:       number  // 이전 단계 수 (전환율 계산용)
}

interface Props {
  steps: FunnelStep[]
}

export function FunnelChart({ steps }: Props) {
  const maxCount = Math.max(...steps.map(s => s.count), 1)

  return (
    <div className="space-y-1.5">
      {steps.map((step, i) => {
        const widthPct    = Math.round((step.count / maxCount) * 100)
        const convRate    = step.prev && step.prev > 0
          ? Math.round((step.count / step.prev) * 100)
          : 100
        const isLowConv   = i > 0 && convRate < 60
        const dropoffPct  = i > 0 ? 100 - convRate : null

        return (
          <div key={i} className="space-y-0.5">
            {/* 단계 바 */}
            <div className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-[10px] text-navi-muted font-bold text-center">
                {i + 1}
              </span>
              <div className="flex-1 h-8 bg-navi-surface2 rounded-lg overflow-hidden relative">
                <div
                  className={`absolute inset-y-0 left-0 rounded-lg flex items-center px-2.5 transition-all duration-500 ${
                    isLowConv ? 'bg-navi-danger/20 border-l-2 border-navi-danger' : 'bg-navi-action/20'
                  }`}
                  style={{ width: `${Math.max(widthPct, 4)}%` }}
                >
                  <span className="text-[11px] font-semibold text-navi-text truncate whitespace-nowrap">
                    {step.label}
                  </span>
                </div>
              </div>
              <div className="w-28 shrink-0 text-right">
                <span className="text-[13px] font-bold text-navi-text">
                  {step.count.toLocaleString()}명
                </span>
                {i > 0 && (
                  <span className={`ml-1.5 text-[11px] font-semibold ${isLowConv ? 'text-navi-danger' : 'text-navi-success'}`}>
                    {convRate}%
                  </span>
                )}
              </div>
            </div>

            {/* 이탈 표시 (단계 사이) */}
            {dropoffPct !== null && dropoffPct > 0 && (
              <div className="ml-8 flex items-center gap-1.5 py-0.5">
                <div className="w-px h-3 bg-navi-border2 ml-2" />
                {isLowConv && (
                  <span className="text-[10px] font-bold text-navi-danger bg-navi-danger/10 px-1.5 py-0.5 rounded-full">
                    ↑ 이탈 {dropoffPct}%
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
