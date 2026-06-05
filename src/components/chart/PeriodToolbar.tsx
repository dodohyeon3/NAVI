'use client'

import { clsx } from 'clsx'
import { useChartStore, type TimeUnit } from '@/stores/chartStore'
import type { Period } from '@/data/mockCandles'

const PERIODS: { value: Period; label: string }[] = [
  { value: '1M',  label: '1개월' },
  { value: '3M',  label: '3개월' },
  { value: '6M',  label: '6개월' },
  { value: '1Y',  label: '1년' },
  { value: 'MAX', label: '전체' },
]

const UNITS: { value: TimeUnit; label: string }[] = [
  { value: 'daily',   label: '일' },
  { value: 'weekly',  label: '주' },
  { value: 'monthly', label: '월' },
]

export function PeriodToolbar() {
  const { period, timeUnit, setPeriod, setTimeUnit } = useChartStore()

  return (
    <div id="period-toolbar" className="flex flex-wrap items-center gap-2">
      {/* 기간 선택 */}
      <div className="flex gap-px bg-navi-surface border border-navi-border rounded-lg p-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={clsx(
              /* 모바일: h-8 (32px) / PC: h-7 (28px) — 터치 타깃 확대 */
              'h-8 sm:h-7 px-2.5 sm:px-3 rounded-md text-[11px] font-medium tracking-wide transition-all duration-150',
              period === p.value
                ? 'bg-navi-action text-white font-semibold'
                : 'text-navi-muted hover:text-navi-secondary'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 구분선 */}
      <div className="w-px h-5 bg-navi-border" />

      {/* 봉 단위 선택 */}
      <div className="flex gap-px bg-navi-surface border border-navi-border rounded-lg p-1">
        {UNITS.map((u) => (
          <button
            key={u.value}
            onClick={() => setTimeUnit(u.value)}
            className={clsx(
              'h-8 sm:h-7 px-3 rounded-md text-[11px] font-medium transition-all duration-150',
              timeUnit === u.value
                ? 'bg-navi-action text-white font-semibold'
                : 'text-navi-muted hover:text-navi-secondary'
            )}
          >
            {u.label}
          </button>
        ))}
      </div>
    </div>
  )
}
