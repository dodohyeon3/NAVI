'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

/* 12단계 여정 미리보기 */
const JOURNEY = [
  { icon: '📊', label: '캔들 클릭',    desc: '하루치 OHLC 데이터 직접 확인' },
  { icon: '📈', label: '이동평균선',   desc: '추세 방향 눈으로 느끼기' },
  { icon: '🎯', label: '볼린저밴드',   desc: '변동성 폭 직접 관찰' },
  { icon: '🌡️', label: 'RSI',          desc: '과열·과냉 구간 판단' },
  { icon: '⚡', label: 'MACD',          desc: '상승/하락 모멘텀 읽기' },
  { icon: '✏️', label: '추세선 그리기', desc: '차트에 직접 선 그어보기' },
  { icon: '🌀', label: '피보나치',      desc: '되돌림 구간 확인' },
  { icon: '🔮', label: '시뮬레이션',    desc: '실제 데이터로 예측 도전' },
]

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1] } },
}

export default function TutorialPage() {
  return (
    <main className="min-h-screen bg-navi-bg px-5 py-10 max-w-lg mx-auto flex flex-col">

      {/* 뒤로가기 */}
      <Link href="/" className="text-navi-muted text-sm hover:text-navi-text mb-10 self-start">
        ← 홈
      </Link>

      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                        bg-indigo-500/10 border border-indigo-500/25 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-indigo-400">읽기만 하는 설명 NO — 직접 해보는 튜토리얼</span>
        </div>
        <h1 className="text-2xl font-black text-navi-text leading-tight">
          차트,<br />
          <span className="text-indigo-400">직접 만져보면</span><br />
          이해돼요
        </h1>
        <p className="text-navi-muted text-sm mt-3 leading-relaxed">
          버튼을 클릭하고, 선을 켜고, 직접 판단하면서<br />
          차트가 어떻게 읽히는지 느껴봐요.
        </p>

        {/* 예상 시간 */}
        <div className="mt-4 flex items-center gap-3 text-xs text-navi-muted">
          <span>⏱ 약 5~7분</span>
          <span>·</span>
          <span>🎯 12단계 실전 체험</span>
          <span>·</span>
          <span>✅ 틀려도 괜찮아요</span>
        </div>
      </motion.div>

      {/* 6단계 여정 */}
      <motion.div
        variants={CONTAINER}
        initial="hidden"
        animate="show"
        className="space-y-2 mb-8"
      >
        {JOURNEY.map((step, i) => (
          <motion.div
            key={i}
            variants={ITEM}
            className="flex items-center gap-4 bg-navi-surface border border-navi-border
                       rounded-2xl px-4 py-3"
          >
            {/* 번호 + 아이콘 */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-[10px] font-bold text-navi-muted w-4 text-right">{i + 1}</span>
              <span className="text-xl">{step.icon}</span>
            </div>

            {/* 텍스트 */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-navi-text">{step.label}</p>
              <p className="text-[11px] text-navi-muted mt-0.5">{step.desc}</p>
            </div>

            {/* 행동 배지 */}
            <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full
                             bg-indigo-500/10 text-indigo-400 font-medium">
              직접 해요
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* 강조 문구 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mb-8 px-4 py-3.5 rounded-2xl bg-navi-surface border border-indigo-500/20"
      >
        <p className="text-xs text-indigo-300 leading-relaxed">
          💡 <strong>틀려도 괜찮아요.</strong> 어떤 버튼을 눌러도 데이터는 사라지지 않아요.
          실제 차트 위에서 직접 클릭하고 느끼는 게 가장 빠른 학습이에요.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
        className="space-y-3 mt-auto"
      >
        {/* 메인 CTA — 튜토리얼 시작 */}
        <Link
          href="/chart?onboard=1"
          className="w-full flex items-center justify-center gap-2 py-4
                     bg-gradient-to-r from-indigo-600 to-indigo-500
                     text-white font-bold text-sm rounded-2xl
                     hover:from-indigo-500 hover:to-indigo-400
                     shadow-lg shadow-indigo-500/25
                     transition-all active:scale-[0.98]"
        >
          <span>🚀</span>
          <span>튜토리얼 시작하기</span>
          <span className="text-indigo-200 text-xs font-normal ml-1">차트 위에서 시작해요</span>
        </Link>

        {/* 세컨더리 — 바로 차트 보기 */}
        <Link
          href="/chart"
          className="w-full flex items-center justify-center py-3
                     border border-navi-border rounded-2xl
                     text-xs text-navi-muted hover:text-navi-text
                     hover:border-navi-accent transition-colors"
        >
          건너뛰고 차트 바로 보기
        </Link>
      </motion.div>

    </main>
  )
}
