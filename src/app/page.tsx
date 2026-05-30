import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="
      min-h-screen bg-navi-bg navi-grid-bg
      flex flex-col items-center justify-center
      px-6 py-16 relative overflow-hidden
    ">

      {/* ── 배경 장식 — NAVI 심볼 대형 × 2 ──────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* 우측 상단 대형 심볼 */}
        <svg
          viewBox="0 0 512 512"
          fill="currentColor"
          className="absolute text-navi-accent"
          style={{
            width: 'min(60vw, 440px)',
            top: '-8%', right: '-12%',
            opacity: 0.07,
            transform: 'rotate(20deg)',
          }}
        >
          <polygon points="62.14 114.89 128.19 276.47 195.99 310.82 172.66 321.38 133.47 397.11 219.77 352.2 240.02 319.62 240.02 230.24 218.01 189.3 62.14 114.89" />
          <polygon points="257.45 254.33 260.09 319.5 385.13 259.18 449.86 104.63 305.44 170.68 257.45 254.33" />
          <polygon points="305.63 303.54 267.76 328.64 280.09 359.46 338.21 386.32 353.84 362.54 348.34 311.91 305.63 303.54" />
        </svg>
        {/* 좌측 하단 심볼 */}
        <svg
          viewBox="0 0 512 512"
          fill="currentColor"
          className="absolute text-navi-accent"
          style={{
            width: 'min(40vw, 280px)',
            bottom: '5%', left: '-8%',
            opacity: 0.05,
            transform: 'rotate(-15deg) scaleX(-1)',
          }}
        >
          <polygon points="62.14 114.89 128.19 276.47 195.99 310.82 172.66 321.38 133.47 397.11 219.77 352.2 240.02 319.62 240.02 230.24 218.01 189.3 62.14 114.89" />
          <polygon points="257.45 254.33 260.09 319.5 385.13 259.18 449.86 104.63 305.44 170.68 257.45 254.33" />
          <polygon points="305.63 303.54 267.76 328.64 280.09 359.46 338.21 386.32 353.84 362.54 348.34 311.91 305.63 303.54" />
        </svg>
      </div>

      {/* ── 브랜드 헤더 ─────────────────────────────────── */}
      <div className="flex flex-col items-center mb-10 relative z-10">
        {/* NAVI Chart 로고 — 원본 SVG 파일 그대로 */}
        <img
          src="/navi-logo.svg"
          alt="NAVI Chart"
          className="w-60 h-auto select-none"
          draggable={false}
        />
      </div>

      {/* ── 헤드라인 ─────────────────────────────────────── */}
      <div className="text-center mb-8 relative z-10">
        <h1 className="text-[26px] sm:text-[30px] font-black tracking-[-0.025em]
                       leading-[1.22] max-w-sm mx-auto mb-3">
          <span style={{ color: 'rgba(248,249,247,0.75)' }}>"RSI를 배웠다"</span>가 아닌<br />
          <span className="text-navi-text">"차트를 분석할 수 있다"</span>
        </h1>
        <p className="text-[13px] leading-relaxed max-w-xs mx-auto"
           style={{ color: 'rgba(248,249,247,0.6)' }}>
          직접 클릭하고, 판단하고, 틀리면서<br />
          차트 분석 능력이 자연스럽게 생겨요.
        </p>
      </div>

      {/* ── CTA ──────────────────────────────────────────── */}
      <div className="flex flex-col w-full max-w-[288px] relative z-10 gap-2.5">

        {/* 주 CTA: 튜토리얼 */}
        {/* 주 CTA = Action color */}
        <Link
          href="/tutorial"
          className="
            w-full h-[52px] flex items-center justify-center
            bg-navi-action text-white
            text-[14px] font-bold tracking-wide
            rounded-xl border border-navi-action
            hover:bg-navi-action-hover
            transition-all duration-150 active:scale-[0.97]
            whitespace-nowrap
            shadow-[0_4px_20px_rgba(91,127,255,0.32)]
          "
        >
          튜토리얼 시작하기
        </Link>

        {/* 버튼 보조 정보 */}
        <div className="flex items-center justify-center gap-2 text-[11px]"
             style={{ color: 'rgba(248,249,247,0.4)' }}>
          <span>약 7~10분</span>
          <span
            className="w-1 h-1 bg-navi-border2 shrink-0 inline-block"
            style={{ clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)' }}
          />
          <span>15단계 실습</span>
          <span
            className="w-1 h-1 bg-navi-border2 shrink-0 inline-block"
            style={{ clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)' }}
          />
          <span>틀려도 괜찮아요</span>
        </div>

        {/* 보조 CTA: 차트 바로 */}
        <Link
          href="/chart"
          className="
            w-full h-11 flex items-center justify-center
            bg-transparent text-navi-secondary
            text-[13px] font-medium
            rounded-xl border border-navi-border
            hover:border-navi-border2 hover:text-navi-text
            transition-all duration-150
            whitespace-nowrap
          "
        >
          차트 바로 보기
        </Link>
      </div>

    </main>
  )
}
