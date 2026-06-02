'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts'
import { useChartStore } from '@/stores/chartStore'
import { calcRSI } from '@/lib/indicators'
import { chartSync } from '@/lib/chartSync'
import { useTheme } from '@/hooks/useTheme'
import { getChartColors } from '@/lib/chartColors'

export function RSIChart() {
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
        scaleMargins: { top: 0.1, bottom: 0.1 },
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

    const rsiData = calcRSI(candleData)

    chart.addLineSeries({
      color: cc.rsiLine, lineWidth: 2,
      lastValueVisible: true, priceLineVisible: false,
    }).setData(rsiData as any)

    if (candleData.length > 0) {
      const first = candleData[0].time
      const last  = candleData[candleData.length - 1].time

      chart.addLineSeries({
        color: cc.rsi70, lineWidth: 1, lineStyle: 2,
        lastValueVisible: false, priceLineVisible: false,
      }).setData([{ time: first, value: 70 }, { time: last, value: 70 }] as any)

      chart.addLineSeries({
        color: cc.rsi30, lineWidth: 1, lineStyle: 2,
        lastValueVisible: false, priceLineVisible: false,
      }).setData([{ time: first, value: 30 }, { time: last, value: 30 }] as any)
    }

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

  return (
    <div id="rsi-chart" className="mt-1">
      <div className="flex items-center gap-3 mb-1 px-1">
        <span className="text-xs font-semibold text-navi-secondary">RSI (14)</span>
        <span className="text-xs" style={{ color: getChartColors(true).rsi70 }}>── 70 과매수</span>
        <span className="text-xs" style={{ color: getChartColors(true).rsi30 }}>── 30 과매도</span>
      </div>
      <div ref={containerRef} className="w-full rounded-xl overflow-hidden" />
    </div>
  )
}
