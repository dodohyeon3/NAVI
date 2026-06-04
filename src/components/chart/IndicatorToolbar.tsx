'use client'

import { clsx } from 'clsx'
import { useChartStore } from '@/stores/chartStore'
import { indicators } from '@/data/indicators'
import { trackEvent } from '@/lib/analytics'
import type { IndicatorSlug } from '@/types'

const ANALYSIS_TOOLS: IndicatorSlug[] = [
  'moving-average',
  'rsi',
  'macd',
  'bollinger',
]

const SHORT_LABELS: Partial<Record<IndicatorSlug, string>> = {
  'moving-average': 'MA',
  rsi:              'RSI',
  macd:             'MACD',
  bollinger:        'BB',
}

export function IndicatorToolbar() {
  const { activeIndicators, toggleIndicator, showVolume, toggleVolume } = useChartStore()

  return (
    /* 모바일: 2열 그리드 (거래량 포함 5개) / PC: flex-wrap */
    <div id="indicator-toolbar" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-1.5 sm:items-center">
      {ANALYSIS_TOOLS.map((slug) => {
        const indicator = indicators[slug]
        const isActive  = activeIndicators.has(slug)

        return (
          <div key={slug} id={`btn-${slug}`} className="relative group">
            <button
              onClick={() => {
                if (!isActive) trackEvent('indicator_enabled', { indicator: SHORT_LABELS[slug] ?? slug })
                toggleIndicator(slug)
              }}
              className={clsx(
                'w-full sm:w-auto h-10 sm:h-8 px-3.5 rounded-lg text-[13px] sm:text-[12px] font-semibold tracking-wide',
                'transition-all duration-200',
                isActive
                  ? 'bg-navi-action text-white border border-navi-action shadow-[0_0_14px_rgba(91,127,255,0.38)]'
                  : 'bg-navi-surface2 text-navi-secondary border border-navi-border hover:border-navi-action/35 hover:text-navi-text hover:bg-navi-surface3'
              )}
            >
              {SHORT_LABELS[slug]}
            </button>
            {/* 호버 툴팁 — PC 전용 */}
            {!isActive && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5
                              bg-navi-surface2 border border-navi-border2 text-navi-secondary text-[11px] rounded-xl
                              whitespace-nowrap opacity-0 group-hover:opacity-100
                              pointer-events-none transition-opacity z-50 hidden sm:block">
                {indicator.oneLineSummary}
                <div className="absolute top-full left-1/2 -translate-x-1/2
                                border-4 border-transparent border-t-navi-border2" />
              </div>
            )}
          </div>
        )
      })}

      {/* 거래량 토글 버튼 */}
      <div className="relative group">
        <button
          id="btn-volume"
          onClick={() => {
            if (!showVolume) trackEvent('indicator_enabled', { indicator: '거래량' })
            toggleVolume()
          }}
          className={clsx(
            'w-full sm:w-auto h-10 sm:h-8 px-3.5 rounded-lg text-[13px] sm:text-[12px] font-semibold tracking-wide',
            'transition-all duration-200',
            showVolume
              ? 'bg-navi-action text-white border border-navi-action shadow-[0_0_14px_rgba(91,127,255,0.38)]'
              : 'bg-navi-surface2 text-navi-secondary border border-navi-border hover:border-navi-action/35 hover:text-navi-text hover:bg-navi-surface3'
          )}
        >
          거래량
        </button>
        {/* 호버 툴팁 — PC 전용 */}
        {!showVolume && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5
                          bg-navi-surface2 border border-navi-border2 text-navi-secondary text-[11px] rounded-xl
                          whitespace-nowrap opacity-0 group-hover:opacity-100
                          pointer-events-none transition-opacity z-50 hidden sm:block">
            하루 거래된 주식 수예요. 가격 움직임의 신뢰도를 확인할 수 있어요.
            <div className="absolute top-full left-1/2 -translate-x-1/2
                            border-4 border-transparent border-t-navi-border2" />
          </div>
        )}
      </div>
    </div>
  )
}
