/**
 * 튜토리얼 단계별 이탈 분석
 * 이탈이 심한 단계를 자동으로 강조 표시
 */

interface Step {
  step:  number
  users: number
}

interface Props {
  steps: Step[]
  title?: string
}

export function StepDropoff({ steps, title }: Props) {
  if (!steps.length) return <p className="text-[12px] text-navi-muted">데이터 없음</p>

  const max      = steps[0]?.users ?? 1
  const ALERT_THRESHOLD = 70  // 이전 단계 대비 70% 미만이면 경고

  return (
    <div className="space-y-1">
      {title && <p className="text-[11px] font-bold text-navi-muted uppercase tracking-[0.08em] mb-3">{title}</p>}
      {steps.map((s, i) => {
        const prev      = i > 0 ? (steps[i - 1]?.users ?? 1) : s.users
        const convRate  = prev > 0 ? Math.round((s.users / prev) * 100) : 100
        const absRate   = max > 0  ? Math.round((s.users / max) * 100)  : 0
        const isAlert   = i > 0 && convRate < ALERT_THRESHOLD

        return (
          <div key={s.step} className={`flex items-center gap-2 px-2 py-1 rounded-lg ${isAlert ? 'bg-navi-danger/[0.06]' : ''}`}>
            <span className={`w-12 shrink-0 text-[11px] font-bold ${isAlert ? 'text-navi-danger' : 'text-navi-muted'}`}>
              Step {s.step}
            </span>
            <div className="flex-1 h-4 bg-navi-surface2 rounded overflow-hidden">
              <div
                className={`h-full rounded transition-all duration-500 ${isAlert ? 'bg-navi-danger/60' : 'bg-navi-action/60'}`}
                style={{ width: `${absRate}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-[11px] text-navi-text font-semibold">
              {absRate}%
            </span>
            <span className="w-12 shrink-0 text-right text-[11px] text-navi-secondary">
              {s.users.toLocaleString()}
            </span>
            {isAlert && (
              <span className="shrink-0 text-[10px] font-bold text-navi-danger">
                ↓{100 - convRate}%
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
