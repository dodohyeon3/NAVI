'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts'
import { useChartStore } from '@/stores/chartStore'
import { calcMACD } from '@/lib/indicators'
import { chartSync } from '@/lib/chartSync'
import { useTheme } from '@/hooks/useTheme'
import { getChartColors } from '@/lib/chartColors'

export function MACDChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { candleData } = useChartStore()
  const { isDark } = useTheme()

  useEffect(() => {
    if (!containerRef.current || candleData.length === 0) return
    const cc = getChartColors(isDark)

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: cc.bg },
        textColor: cc.text,
      },
      grid: {
        vertLines: { color: cc.grid },
        horzLines: { color: cc.grid },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: cc.border,
        scaleMargins: { top: 0.15, bottom: 0.15 },
      },
      timeScale: {
        borderColor: cc.border,
        visible: false,
      },
      handleScroll: false,
      handleScale: false,
      width: containerRef.current.clientWidth,
      height: window.innerWidth < 640 ? 80 : 100,
    })

    const macdData = calcMACD(candleData)

    chart.addHistogramSeries({
      color: cc.histPos,
      lastValueVisible: false,
      priceLineVisible: false,
    }).setData(
      macdData
        .filter((d) => d.histogram !== null)
        .map((d) => ({
          time:  d.time,
          value: d.histogram!,
          color: d.histogram! >= 0 ? cc.histPos : cc.histNeg,
        })) as any
    )

    chart.addLineSeries({
      color: cc.macdLine, lineWidth: 2,
      lastValueVisible: true, priceLineVisible: false,
    }).setData(macdData.map((d) => ({ time: d.time, value: d.macd })) as any)

    chart.addLineSeries({
      color: cc.signalLine, lineWidth: 1,
      lastValueVisible: true, priceLineVisible: false,
    }).setData(
      macdData
        .filter((d) => d.signal !== null)
        .map((d) => ({ time: d.time, value: d.signal! })) as any
    )

    chart.timeScale().fitContent()

    const unsub = chartSync.subscribe((range) => {
      chart.timeScale().setVisibleRange(range)
    })

    const handleResize = () => {
      if (containerRef.current)
        chart.applyOptions({ width: containerRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      unsub()
      chart.remove()
    }
  }, [candleData, isDark])

  const cc = getChartColors(true) // 범례는 다크 기준으로 고정 (인라인 style이라 CSS var 미사용)
  return (
    <div id="macd-chart" className="mt-1">
      <div className="flex items-center gap-3 mb-1 px-1">
        <span className="text-xs font-semibold text-navi-secondary">MACD (12,26,9)</span>
        <span className="text-xs" style={{ color: cc.signalLine }}>── 시그널</span>
        <span className="text-xs text-navi-muted">▌ 히스토그램</span>
      </div>
      <div ref={containerRef} className="w-full rounded-xl overflow-hidden" />
    </div>
  )
}
