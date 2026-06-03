interface KPICardProps {
  label:    string
  value:    string | number
  sub?:     string          // 보조 텍스트 (예: "30일 기준")
  accent?:  boolean         // 강조 색상 여부
  alert?:   boolean         // 경고 색상 (낮은 완료율 등)
  pct?:     number          // 0~100 % bar
}

export function KPICard({ label, value, sub, accent, alert, pct }: KPICardProps) {
  const borderColor = alert   ? 'border-navi-danger/30'
                    : accent  ? 'border-navi-action/30'
                    : 'border-navi-border'

  const valueColor  = alert   ? 'text-navi-danger'
                    : accent  ? 'text-navi-action'
                    : 'text-navi-text'

  return (
    <div className={`bg-navi-surface border ${borderColor} rounded-2xl p-4 flex flex-col gap-1.5`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-navi-muted">{label}</p>
      <p className={`text-[26px] font-black leading-none ${valueColor}`}>{value}</p>
      {sub && <p className="text-[11px] text-navi-muted">{sub}</p>}
      {pct !== undefined && (
        <div className="mt-1 h-1 bg-navi-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${alert ? 'bg-navi-danger' : 'bg-navi-action'}`}
            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          />
        </div>
      )}
    </div>
  )
}
