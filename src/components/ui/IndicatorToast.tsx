'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ToastInfo {
  slug: string; icon: string; title: string; body: string; hint: string
}

const TOAST_MAP: Record<string, Omit<ToastInfo, 'slug'>> = {
  'moving-average': {
    icon: '📊', title: '이동평균선(MA) 활성화',
    body: '4개의 선이 각각 5일·20일·60일·120일 평균 가격을 나타내요.',
    hint: '선들이 함께 위를 향하면 상승 추세 신호예요',
  },
  'bollinger': {
    icon: '〰️', title: '볼린저 밴드(BB) 활성화',
    body: '주가를 감싸는 상·하단 밴드가 표시됐어요. 밴드 폭이 핵심이에요.',
    hint: '밴드가 좁아지면 큰 움직임이 올 수 있어요',
  },
  'rsi': {
    icon: '🌡️', title: 'RSI 활성화',
    body: '차트 아래 0~100 사이 선이 과열 정도를 보여줘요.',
    hint: '70 이상 과매수 / 30 이하 과매도',
  },
  'macd': {
    icon: '🔄', title: 'MACD 활성화',
    body: '파란선(MACD)과 주황선(시그널)의 교차 순간을 포착해요.',
    hint: '파란선이 주황선을 위로 교차하면 매수 신호예요',
  },
}

interface Props {
  slug: string | null
  onDone: () => void
}

export function IndicatorToast({ slug, onDone }: Props) {
  const [visible, setVisible] = useState(false)
  const info = slug ? TOAST_MAP[slug] : null

  useEffect(() => {
    if (!slug || !info) return
    setVisible(true)
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 250) }, 5000)
    return () => clearTimeout(t)
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {visible && info && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{   opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]
                     w-[min(360px,calc(100vw-32px))]
                     bg-navi-surface border border-navi-border2 rounded-xl
                     shadow-[0_8px_40px_rgba(0,0,0,0.6)] px-4 py-3"
        >
          <div className="flex items-start gap-3">
            <span className="text-lg shrink-0 mt-0.5">{info.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-navi-text mb-0.5 tracking-wide">
                {info.title}
              </p>
              <p className="text-[11px] text-navi-secondary leading-relaxed">{info.body}</p>
              {/* 힌트 = Info 색상 */}
              <p className="text-[11px] text-navi-info mt-1 font-medium flex items-center gap-1.5">
                <span style={{ color: 'rgba(79,209,255,0.6)' }}>💡</span>
                {info.hint}
              </p>
            </div>
            <button
              onClick={() => { setVisible(false); setTimeout(onDone, 250) }}
              className="text-navi-muted hover:text-navi-secondary text-[12px] shrink-0 transition-colors"
            >✕</button>
          </div>
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-navi-action/50 rounded-b-xl"
            initial={{ width: '100%' }}
            animate={{ width: '0%'   }}
            transition={{ duration: 5.0, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
