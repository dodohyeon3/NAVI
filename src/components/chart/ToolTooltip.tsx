'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Indicator } from '@/types'

interface Props {
  indicator: Indicator
  visible:   boolean
}

export function ToolTooltip({ indicator, visible }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{   opacity: 0, y: 4, scale: 0.97 }}
          transition={{ duration: 0.13 }}
          className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2
                     z-[200] w-56
                     rounded-xl bg-navi-surface2 border border-navi-border2
                     shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                     p-3.5 pointer-events-none"
        >
          {/* 말풍선 꼬리 */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-[7px]
                          border-[7px] border-transparent border-t-navi-border2" />
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-[6px]
                          border-[6px] border-transparent border-t-navi-surface2" />

          <p className="text-[12px] font-bold text-navi-text leading-tight">
            {indicator.name}
          </p>
          <p className="text-[11px] text-navi-secondary mt-1 leading-relaxed">
            {indicator.oneLineSummary}
          </p>
          <p className="mt-2 text-[10px] tracking-[0.05em] uppercase text-navi-muted font-semibold">
            클릭하면 차트에 표시
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
