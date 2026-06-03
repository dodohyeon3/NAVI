/**
 * 수평 막대 차트 (순수 CSS — 외부 의존 없음)
 */

interface Bar {
  label: string
  value: number
  sub?:  string   // 오른쪽 보조 텍스트
  alert?: boolean // 빨간 강조
}

interface Props {
  bars:    Bar[]
  unit?:   string  // 값 옆 단위 (예: '명', '%')
  maxVal?: number  // 명시적 max (기본: bars 중 최대값)
}

export function HBarChart({ bars, unit = '', maxVal }: Props) {
  const max = maxVal ?? Math.max(...bars.map(b => b.value), 1)

  return (
    <div className="space-y-2.5">
      {bars.map((bar, i) => {
        const pct = Math.round((bar.value / max) * 100)
        return (
          <div key={i} className="flex items-center gap-3">
            <p className="w-28 shrink-0 text-[12px] text-navi-secondary truncate text-right">
              {bar.label}
            </p>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-5 bg-navi-surface2 rounded-md overflow-hidden">
                <div
                  className={`h-full rounded-md transition-all duration-500 ${
                    bar.alert ? 'bg-navi-danger/70' : 'bg-navi-action/70'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-[12px] text-navi-text font-semibold text-right">
                {bar.value.toLocaleString()}{unit}
              </span>
            </div>
            {bar.sub && (
              <span className="text-[11px] text-navi-muted w-12 shrink-0 text-right">{bar.sub}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
