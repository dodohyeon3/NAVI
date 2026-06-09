/**
 * NAVI 앱 아이콘 심볼 — NAVI앱로고.svg의 날개 폴리곤 3개를 인라인으로
 * 배경 rect 없음 / fill="currentColor" 로 CSS 색상 상속
 */
interface Props {
  className?: string
}

export function NaviSymbol({ className = 'w-6 h-6' }: Props) {
  return (
    <svg
      viewBox="0 0 480 480"
      className={className}
      aria-label="NAVI"
      fill="currentColor"
    >
      {/* 좌측 날개 */}
      <polygon points="64.16 86.53 110.02 254.96 173.14 297.31 148.69 304.95 100.56 375.34 191.69 341.28 215.76 311.41 226.66 222.7 209.8 179.38 64.16 86.53" />
      {/* 우측 날개 */}
      <polygon points="241.02 248.74 235.7 313.74 367.16 269.1 450.23 123.6 298.84 171.55 241.02 248.74" />
      {/* 접합 다이아몬드 */}
      <polygon points="282.84 303.45 242.2 323.75 250.68 355.84 305.09 389.58 323.5 367.89 324.21 316.96 282.84 303.45" />
    </svg>
  )
}
