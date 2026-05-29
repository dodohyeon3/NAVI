'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { ToolTooltip } from './ToolTooltip'
import { useChartStore } from '@/stores/chartStore'
import { indicators } from '@/data/indicators'
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
  const { activeIndicators, toggleIndicator } = useChartStore()
  const [hovered, setHovered] = useState<IndicatorSlug | null>(null)

  return (
    <div id="indicator-toolbar" className="flex flex-wrap gap-1.5 items-center">
      {ANALYSIS_TOOLS.map((slug) => {
        const indicator = indicators[slug]
        const isActive  = activeIndicators.has(slug)

        return (
          <div
            key={slug}
            id={`btn-${slug}`}
            className="relative"
            onMouseEnter={() => setHovered(slug)}
            onMouseLeave={() => setHovered(null)}
          >
            <button
              onClick={() => toggleIndicator(slug)}
              className={clsx(
                'h-8 px-3.5 rounded-lg text-[12px] font-semibold tracking-wide',
                'transition-all duration-200',
                isActive
                  /* Action color — 사용자가 켠 상태 = 행동 완료 */
                  ? 'bg-navi-action text-white border border-navi-action shadow-[0_0_14px_rgba(91,127,255,0.38)]'
                  : 'bg-navi-surface2 text-navi-secondary border border-navi-border hover:border-navi-action/35 hover:text-navi-text hover:bg-navi-surface3'
              )}
            >
              {SHORT_LABELS[slug]}
            </button>
            <ToolTooltip indicator={indicator} visible={hovered === slug} />
          </div>
        )
      })}
    </div>
  )
}
