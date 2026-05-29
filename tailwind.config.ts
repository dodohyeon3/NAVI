import type { Config } from 'tailwindcss'

/**
 * NAVI Design System — Color Roles
 * ─────────────────────────────────────────────────────────────
 * bg / surface*     : 공간 구조 (70% dark, 20% surface)
 * accent (#2D4198)  : 브랜드 식별 — 로고, 헤더, 브랜드 포인트
 * action (#5B7FFF)  : 행동 유도 — CTA, 활성 탭, 진행, 다음 버튼
 * success (#32D17A) : 성공/완료 — 정답, 자동진행, 완료 상태
 * info (#4FD1FF)    : 안내/힌트 — 툴팁, 가이드, 설명
 * warning (#FFB84D) : 주의
 * danger (#FF6B6B)  : 오류/위험 — 오답, 경고
 * ─────────────────────────────────────────────────────────────
 * text / secondary / muted / disabled : 텍스트 위계 (rgba opacity)
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navi: {
          /* ── 공간 (Space) ─────────────────────────────── */
          bg:        '#030617',   // deep space background (70%)
          surface:   '#101936',   // primary card surface
          surface2:  '#162142',   // inner / secondary elements
          surface3:  '#1B2B55',   // interactive / hover
          border:    '#1B2847',   // card outline
          border2:   '#263558',   // secondary border

          /* ── 브랜드 (Brand) — logo & identity ─────────── */
          accent:         '#2D4198',
          'accent-hover': '#3D54BF',
          'accent-dim':   'rgba(45,65,152,0.14)',

          /* ── 행동 (Action) — CTA, active, progress ────── */
          action:         '#5B7FFF',
          'action-hover': '#4A6EF0',
          'action-dim':   'rgba(91,127,255,0.12)',

          /* ── 시맨틱 상태 (Semantic states) ──────────────── */
          success:     '#32D17A',
          'success-dim': 'rgba(50,209,122,0.12)',
          info:        '#4FD1FF',
          'info-dim':  'rgba(79,209,255,0.10)',
          warning:     '#FFB84D',
          'warning-dim': 'rgba(255,184,77,0.12)',
          danger:      '#FF6B6B',
          'danger-dim': 'rgba(255,107,107,0.12)',

          /* ── 텍스트 위계 (Text hierarchy) ───────────────── */
          text:     '#F8F9F7',                      // primary   100%
          secondary: 'rgba(248,249,247,0.72)',       // secondary  72%
          muted:    'rgba(248,249,247,0.44)',        // tertiary   44%
          disabled: 'rgba(248,249,247,0.24)',        // disabled   24%

          /* ── 차트 전용 (Chart) ───────────────────────── */
          bullish: '#26a69a',
          bearish: '#ef5350',
          green:   '#26a69a',
          red:     '#ef5350',
        },
      },
      keyframes: {
        'navi-slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'navi-fade': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'navi-pulse-ring': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.15)' },
        },
      },
      animation: {
        'navi-slide-up':   'navi-slide-up 200ms cubic-bezier(0.16,1,0.3,1) forwards',
        'navi-fade':       'navi-fade 150ms ease-out forwards',
        'navi-pulse-ring': 'navi-pulse-ring 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
