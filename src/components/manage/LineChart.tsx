/**
 * 방문자 추이 SVG 라인 차트 (외부 의존 없음)
 */

interface DataPoint {
  date:      string
  visitors:  number
  pageviews: number
  sessions:  number
}

interface Props {
  data: DataPoint[]
}

const W = 600
const H = 120
const PAD = { top: 8, right: 8, bottom: 24, left: 36 }

function scaleX(i: number, n: number) {
  return PAD.left + (i / (n - 1)) * (W - PAD.left - PAD.right)
}
function scaleY(v: number, max: number) {
  return PAD.top + (1 - v / Math.max(max, 1)) * (H - PAD.top - PAD.bottom)
}
function polyline(data: DataPoint[], key: keyof DataPoint, max: number) {
  return data
    .map((d, i) => `${scaleX(i, data.length).toFixed(1)},${scaleY(Number(d[key]), max).toFixed(1)}`)
    .join(' ')
}

export function LineChart({ data }: Props) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.pageviews), 1)
  const n   = data.length

  // x-axis labels: first, middle, last
  const labelIdxs = [0, Math.floor(n / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[320px]"
        style={{ height: H }}
        aria-label="방문자 추이 차트"
      >
        {/* 그리드 선 */}
        {[0.25, 0.5, 0.75, 1].map(t => (
          <line
            key={t}
            x1={PAD.left} x2={W - PAD.right}
            y1={scaleY(max * t, max)} y2={scaleY(max * t, max)}
            stroke="var(--color-navi-border)" strokeWidth="0.5" strokeDasharray="3 3"
          />
        ))}

        {/* Pageviews 라인 */}
        <polyline
          points={polyline(data, 'pageviews', max)}
          fill="none" stroke="rgba(91,127,255,0.5)" strokeWidth="1.5"
        />
        {/* Visitors 라인 */}
        <polyline
          points={polyline(data, 'visitors', max)}
          fill="none" stroke="rgba(91,127,255,1)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        />

        {/* x축 레이블 */}
        {labelIdxs.map(i => (
          <text
            key={i}
            x={scaleX(i, n)}
            y={H - 4}
            textAnchor="middle"
            fontSize="9"
            fill="var(--color-navi-muted)"
          >
            {data[i]?.date.slice(5)}
          </text>
        ))}

        {/* y축 레이블 */}
        <text x={PAD.left - 4} y={scaleY(max, max) + 4}   textAnchor="end" fontSize="9" fill="var(--color-navi-muted)">{max.toLocaleString()}</text>
        <text x={PAD.left - 4} y={scaleY(max * 0.5, max) + 4} textAnchor="end" fontSize="9" fill="var(--color-navi-muted)">{Math.round(max * 0.5).toLocaleString()}</text>
        <text x={PAD.left - 4} y={scaleY(0, max) + 4}     textAnchor="end" fontSize="9" fill="var(--color-navi-muted)">0</text>
      </svg>

      {/* 범례 */}
      <div className="flex gap-4 mt-1 justify-end pr-2">
        {[
          { label: '방문자', color: 'bg-navi-action' },
          { label: '페이지뷰', color: 'bg-navi-action/50' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-1 rounded ${color}`} />
            <span className="text-[10px] text-navi-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
