'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useTutorialStore } from '@/stores/tutorialStore'
import { useChartStore }    from '@/stores/chartStore'
import { calcMA, calcRSI, calcMACD } from '@/lib/indicators'
import type { TutorialStep as TStep, CandleData } from '@/types'
import { clsx } from 'clsx'

/* ─── 상수 ────────────────────────────────────────────────── */
const PAD       = 6
const SCROLL_MS = 320

/* ─── 패널 높이 ─────────────────────────────────────────────── */
const PANEL_H_CSS = 'clamp(200px, 26vh, 280px)'
const getPanelH   = () =>
  typeof window !== 'undefined'
    ? Math.min(Math.max(window.innerHeight * 0.26, 200), 280)
    : 240

/* ─── 패널 모드 ─────────────────────────────────────────────── */
type PanelMode = 'mini' | 'judgment' | 'reading' | 'feedback' | 'test'

function getMode(step: TStep, done: boolean): PanelMode {
  if (step.actionRequired === 'comprehensive-test') return 'test'
  if (done) return 'feedback'
  if (step.actionRequired === 'indicator-toggle')   return 'mini'
  if (step.actionRequired === 'judgment')           return 'judgment'
  return 'reading'
}

/* ─── 하이라이트 링 타입 ─────────────────────────────────────── */
interface HighlightRect {
  top: number; left: number; width: number; height: number
  bottom: number; right: number
}

function calcHighlight(el: Element): HighlightRect {
  const r = el.getBoundingClientRect()
  return {
    top:    r.top    - PAD,
    left:   r.left   - PAD,
    width:  r.width  + PAD * 2,
    height: r.height + PAD * 2,
    bottom: r.bottom + PAD,
    right:  r.right  + PAD,
  }
}

/* ─── smartScroll ─────────────────────────────────────────── */
function smartScroll(step: TStep, panelHeight: number) {
  const subId =
    step.id === 'rsi-judgment'  ? 'rsi-chart'  :
    step.id === 'macd-judgment' ? 'macd-chart' : null

  const targetEl = subId
    ? document.getElementById(subId)
    : document.querySelector(step.targetSelector)

  if (!targetEl) return
  const rect      = targetEl.getBoundingClientRect()
  const vh        = window.innerHeight
  const safeBottom = vh - panelHeight - 16
  const safeTop    = 64

  if (rect.bottom > safeBottom)
    window.scrollBy({ top: rect.bottom - safeBottom, behavior: 'smooth' })
  else if (rect.top < safeTop)
    window.scrollBy({ top: rect.top - safeTop, behavior: 'smooth' })
}

/* ══════════════════════════════════════════════════════════════
   종합 테스트 채점 함수 (순수 함수, 컴포넌트 외부)
══════════════════════════════════════════════════════════════ */
function scoreTrend(candles: CandleData[]): 'up' | 'sideways' | 'down' {
  if (candles.length < 30) return 'sideways'
  const ma20 = calcMA(candles, 20)
  const ma60 = calcMA(candles, 60)
  const n20 = ma20.length, n60 = ma60.length
  if (n20 < 10) return 'sideways'
  const d20 = ma20[n20 - 1].value - ma20[Math.max(0, n20 - 10)].value
  const d60 = n60 >= 10
    ? ma60[n60 - 1].value - ma60[Math.max(0, n60 - 10)].value
    : 0
  if (d20 > 0 && d60 >= 0) return 'up'
  if (d20 < 0 && d60 <= 0) return 'down'
  return 'sideways'
}

function scoreRSI(candles: CandleData[]): 'overbought' | 'neutral' | 'oversold' {
  const rsi = calcRSI(candles)
  const v = rsi[rsi.length - 1]?.value ?? 50
  if (v >= 65) return 'overbought'
  if (v <= 35) return 'oversold'
  return 'neutral'
}

function scoreMACDSignal(candles: CandleData[]): 'bullish' | 'bearish' {
  const d = calcMACD(candles).filter(x => x.signal !== null)
  const last = d[d.length - 1]
  if (!last) return 'bearish'
  return last.macd > (last.signal ?? 0) ? 'bullish' : 'bearish'
}

/* ══════════════════════════════════════════════════════════════
   종합 테스트 문항 정의
══════════════════════════════════════════════════════════════ */
interface TestQ {
  id:       string
  label:    string
  hint:     string
  choices:  { v: string; icon: string; label: string }[]
  correct:  string | null  // null = 자유 답변 (예측)
  feedback: Record<string, string>
}

function buildTestQuestions(candles: CandleData[]): TestQ[] {
  const trendAns = scoreTrend(candles)
  const rsiAns   = scoreRSI(candles)
  const macdAns  = scoreMACDSignal(candles)

  return [
    {
      id:    'trend',
      label: '📈 현재 추세는?',
      hint:  'MA 선들의 방향을 봐요',
      correct: trendAns,
      choices: [
        { v: 'up',       icon: '📈', label: '상승 추세' },
        { v: 'sideways', icon: '➡️', label: '횡보'     },
        { v: 'down',     icon: '📉', label: '하락 추세' },
      ],
      feedback: {
        up:       'MA선들이 우상향 중이에요. 상승 추세 구간이에요.',
        sideways: 'MA선들이 방향 없이 얽혀 있어요. 추세가 불분명한 구간이에요.',
        down:     'MA선들이 우하향 중이에요. 하락 추세 구간이에요.',
      },
    },
    {
      id:    'rsi',
      label: '🌡️ RSI 상태는?',
      hint:  'RSI 그래프 오른쪽 끝 값을 봐요',
      correct: rsiAns,
      choices: [
        { v: 'overbought', icon: '🔴', label: '과열 (70+)' },
        { v: 'neutral',    icon: '⚪', label: '중립'       },
        { v: 'oversold',   icon: '🟢', label: '침체 (30-)' },
      ],
      feedback: {
        overbought: 'RSI가 65 이상이에요. 과매수 구간으로 조정 가능성이 있어요.',
        neutral:    'RSI가 중립 구간(35~65)에 있어요. 방향을 단언하기 어려운 상태예요.',
        oversold:   'RSI가 35 이하예요. 과매도 구간으로 반등 가능성이 있어요.',
      },
    },
    {
      id:    'macd',
      label: '🔄 MACD 상태는?',
      hint:  '파란선(MACD)과 주황선(시그널) 위치를 봐요',
      correct: macdAns,
      choices: [
        { v: 'bullish', icon: '🔵', label: '상승 모멘텀 (파란선 위)' },
        { v: 'bearish', icon: '🟠', label: '하락 모멘텀 (주황선 위)' },
      ],
      feedback: {
        bullish: 'MACD선이 시그널선 위에 있어요. 상승 모멘텀이 있어요.',
        bearish: 'MACD선이 시그널선 아래에 있어요. 하락 압력이 있어요.',
      },
    },
    {
      id:    'prediction',
      label: '🎯 당신의 예측은?',
      hint:  '위 분석을 종합해서 자유롭게 판단해봐요 (정답 없음)',
      correct: null,
      choices: [
        { v: 'up',       icon: '📈', label: '상승' },
        { v: 'sideways', icon: '➡️', label: '횡보' },
        { v: 'down',     icon: '📉', label: '하락' },
      ],
      feedback: {
        up:       '상승을 예측했어요! 시뮬레이션에서 맞는지 직접 확인해봐요.',
        sideways: '횡보를 예측했어요! 시뮬레이션에서 직접 검증해봐요.',
        down:     '하락을 예측했어요! 시뮬레이션에서 맞는지 확인해봐요.',
      },
    },
  ]
}

/* ══════════════════════════════════════════════════════════════
   컴포넌트
══════════════════════════════════════════════════════════════ */
export function TutorialStep() {
  const {
    currentStep, currentIndex, steps,
    stepDone, candleData: clickedCandle, chosenJudgment,
    next, prev, skip, notifyJudgment, markStepDone,
  } = useTutorialStore()

  const { activeIndicators, candleData: chartCandles } = useChartStore()

  const [hl,        setHl]        = useState<HighlightRect | null>(null)
  const [showPanel, setShowPanel] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── 종합 테스트 상태 (부모 레벨 — hooks 규칙 준수) ──── */
  const [testQIdx,    setTestQIdx]    = useState(0)
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({})
  const [testDone,    setTestDone]    = useState(false)

  const mode = currentStep ? getMode(currentStep, stepDone) : 'reading'

  /* ── indicator-toggle 감지 ─────────────────────────────── */
  useEffect(() => {
    if (!currentStep ||
        currentStep.actionRequired !== 'indicator-toggle' ||
        !currentStep.indicatorKey  ||
        stepDone) return
    if (activeIndicators.has(currentStep.indicatorKey as any)) markStepDone()
  }, [activeIndicators, currentStep, stepDone, markStepDone])

  /* ── 하이라이트 재계산 ──────────────────────────────────── */
  const recompute = useCallback(() => {
    if (!currentStep) { setHl(null); return }
    const el = document.querySelector(currentStep.targetSelector)
    if (!el) { setHl(null); return }
    const rect = el.getBoundingClientRect()
    if (rect.bottom < 0 || rect.top > window.innerHeight) { setHl(null); return }
    setHl(calcHighlight(el))
  }, [currentStep])

  /* ── 단계 변경 ────────────────────────────────────────────── */
  useEffect(() => {
    if (!currentStep) { setHl(null); setShowPanel(false); return }
    if (timerRef.current) clearTimeout(timerRef.current)
    setShowPanel(false); setHl(null)

    // 테스트 상태 초기화
    setTestQIdx(0); setTestAnswers({}); setTestDone(false)

    smartScroll(currentStep, getPanelH())

    timerRef.current = setTimeout(() => {
      recompute()
      setShowPanel(true)
    }, SCROLL_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [currentStep]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { recompute() }, [stepDone, recompute])

  useEffect(() => {
    const h = () => recompute()
    window.addEventListener('scroll', h, { passive: true })
    window.addEventListener('resize', h)
    return () => { window.removeEventListener('scroll', h); window.removeEventListener('resize', h) }
  }, [recompute])

  if (!currentStep) return null

  const isLast    = currentIndex === steps.length - 1
  const canAdvance =
    !currentStep.actionRequired ||
    currentStep.actionRequired === 'free' ||
    (currentStep.actionRequired === 'comprehensive-test' && testDone) ||
    stepDone

  /* ── 공통 헤더 배지 ─────────────────────────────────────── */
  const StepBadge = () => (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
        {currentIndex + 1} / {steps.length}
      </span>
      <span className="text-[9px] text-gray-400">어떤 버튼도 안전해요 🙂</span>
    </div>
  )

  /* ── 선형 진행 바 + 네비게이션 ─────────────────────────── */
  const Nav = () => (
    <div className="px-5 pb-3 pt-2 border-t border-gray-100 flex-shrink-0">
      {/* 진행 바 */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">
          {currentIndex + 1} / {steps.length}
        </span>
      </div>

      {/* 버튼 행 */}
      <div className="flex items-center justify-between">
        <button
          onClick={skip}
          className="text-[11px] text-gray-300 hover:text-gray-500 transition-colors"
        >
          건너뛰기
        </button>
        <div className="flex gap-2">
          {currentIndex > 0 && (
            <button onClick={prev}
              className="px-3 py-1.5 rounded-xl text-[12px] text-gray-400 border border-gray-200
                         hover:border-gray-300 hover:text-gray-600 transition">
              이전
            </button>
          )}
          {!isLast ? (
            <button
              onClick={canAdvance ? next : undefined}
              className={canAdvance
                ? 'px-4 py-1.5 rounded-xl text-[12px] font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition shadow-sm'
                : 'px-4 py-1.5 rounded-xl text-[12px] font-semibold bg-gray-100 text-gray-400 cursor-not-allowed'
              }>
              {canAdvance ? '다음 →' : '↑ 먼저 해보세요'}
            </button>
          ) : (
            <Link href="/simulate" onClick={skip}
              className="px-4 py-1.5 rounded-xl text-[12px] font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-400 hover:to-indigo-500 transition shadow-sm">
              🚀 시뮬레이션 시작
            </Link>
          )}
        </div>
      </div>
    </div>
  )

  /* ════════════════════════════════════════════════════════════
     MINI 모드 — 지표 토글 대기
  ════════════════════════════════════════════════════════════ */
  const MiniContent = () => (
    <div className="px-5 py-3.5 flex items-center gap-3 flex-1">
      <div className="flex-1 min-w-0">
        <StepBadge />
        <p className="text-[13px] font-bold text-gray-800 mt-1 truncate">{currentStep.title}</p>
        {currentStep.mission && (
          <p className="text-[11px] text-indigo-600 mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
            {currentStep.mission}
          </p>
        )}
      </div>
    </div>
  )

  /* ════════════════════════════════════════════════════════════
     JUDGMENT 모드 — 3지선다
  ════════════════════════════════════════════════════════════ */
  const JudgmentContent = () => (
    <div className="px-5 pt-3 pb-1 overflow-y-auto flex-1">
      <div className="flex items-start justify-between mb-2">
        <div>
          <StepBadge />
          <p className="text-[14px] font-bold text-gray-900 mt-1">{currentStep.title}</p>
        </div>
      </div>
      {currentStep.judgment && (
        <div>
          <p className="text-[12px] font-semibold text-gray-700 mb-2">
            {currentStep.judgment.question}
          </p>
          <div className="flex flex-col gap-1.5">
            {currentStep.judgment.choices.map(choice => (
              <button
                key={choice.value}
                onClick={() => notifyJudgment(choice.value)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200
                           hover:border-indigo-300 hover:bg-indigo-50 active:bg-indigo-100
                           transition-all text-left group"
              >
                <span className="text-lg shrink-0">{choice.icon}</span>
                <span className="text-[12px] font-medium text-gray-700 group-hover:text-indigo-700">
                  {choice.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  /* ════════════════════════════════════════════════════════════
     READING 모드 — 설명 + 미션
  ════════════════════════════════════════════════════════════ */
  const ReadingContent = () => (
    <div className="px-5 pt-3 pb-1 overflow-y-auto flex-1">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex-1 min-w-0">
          <StepBadge />
          <p className="font-bold text-gray-900 text-[15px] leading-snug mt-1">{currentStep.title}</p>
        </div>
      </div>
      <div className="text-[12.5px] text-gray-500 leading-relaxed whitespace-pre-line">
        {currentStep.body}
      </div>
      {currentStep.tips && currentStep.tips.length > 0 && (
        <ul className="mt-2.5 space-y-1 rounded-2xl bg-gray-50 p-3">
          {currentStep.tips.map((tip, i) => (
            <li key={i} className="flex gap-2 text-[11.5px] text-gray-600 leading-relaxed">
              <span className="text-indigo-300 shrink-0 mt-px">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
      {currentStep.mission && !stepDone && (
        <div className="mt-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 p-3">
          <p className="text-[10px] font-bold text-indigo-500 mb-1">🎯 지금 해보세요</p>
          <p className="text-[12px] text-indigo-700 leading-relaxed">{currentStep.mission}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[10px] text-indigo-400">행동을 기다리는 중...</span>
          </div>
        </div>
      )}
    </div>
  )

  /* ════════════════════════════════════════════════════════════
     FEEDBACK 모드 — 완료 피드백
  ════════════════════════════════════════════════════════════ */
  const FeedbackContent = () => (
    <div className="px-5 pt-3 pb-1 overflow-y-auto flex-1">
      <div className="flex items-start justify-between mb-2">
        <div>
          <StepBadge />
          <p className="text-[14px] font-bold text-gray-900 mt-1">{currentStep.title}</p>
        </div>
      </div>

      {/* 판단 피드백 */}
      {currentStep.actionRequired === 'judgment' && currentStep.judgment && chosenJudgment && (
        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">
              {currentStep.judgment.choices.find(c => c.value === chosenJudgment)?.icon}
            </span>
            <span className="text-[10px] font-bold text-indigo-500">내 선택</span>
            <span className="text-[11px] text-indigo-600">
              {currentStep.judgment.choices.find(c => c.value === chosenJudgment)?.label}
            </span>
          </div>
          <p className="text-[12px] text-indigo-700 leading-relaxed">
            {currentStep.judgment.choices.find(c => c.value === chosenJudgment)?.feedback}
          </p>
        </div>
      )}

      {/* 캔들 OHLC 카드 */}
      {clickedCandle && currentStep.actionRequired === 'candle-click' && (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-[10px] font-bold text-slate-500 mb-2">📊 클릭한 날 ({clickedCandle.time})</p>
          <div className="grid grid-cols-5 gap-1">
            {[
              { label: '시가',  value: `$${clickedCandle.open.toFixed(2)}`,  color: '' },
              { label: '고가',  value: `$${clickedCandle.high.toFixed(2)}`,  color: '#10b981' },
              { label: '저가',  value: `$${clickedCandle.low.toFixed(2)}`,   color: '#ef4444' },
              { label: '종가',  value: `$${clickedCandle.close.toFixed(2)}`, color: '' },
              {
                label: '변동',
                value: `${clickedCandle.close >= clickedCandle.open ? '+' : ''}${((clickedCandle.close - clickedCandle.open) / clickedCandle.open * 100).toFixed(1)}%`,
                color: clickedCandle.close >= clickedCandle.open ? '#10b981' : '#ef4444',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center bg-white rounded-lg px-1 py-1.5">
                <span className="text-[9px] text-slate-400">{label}</span>
                <span className="text-[10px] font-bold mt-0.5"
                  style={color ? { color } : { color: '#374151' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 완료 메시지 */}
      {currentStep.completionMessage && (
        <div className="mt-2 rounded-2xl bg-green-50 border border-green-200 p-3 flex items-start gap-2">
          <span className="text-green-500 text-sm shrink-0">✅</span>
          <p className="text-[12px] text-green-700 leading-relaxed">{currentStep.completionMessage}</p>
        </div>
      )}
    </div>
  )

  /* ════════════════════════════════════════════════════════════
     TEST 모드 — 종합 차트 읽기 테스트
  ════════════════════════════════════════════════════════════ */
  const TestContent = () => {
    const questions = buildTestQuestions(chartCandles)
    const q = questions[testQIdx]

    if (testDone) {
      const scoreCount = questions
        .filter(tq => tq.correct && testAnswers[tq.id] === tq.correct)
        .length
      const total = questions.filter(tq => tq.correct !== null).length

      return (
        <div className="px-5 pt-3 pb-1 overflow-y-auto flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <StepBadge />
              <p className="text-[14px] font-bold text-gray-900 mt-1">
                {scoreCount >= total ? '🎯' : scoreCount >= total - 1 ? '✅' : '📚'}{' '}
                {scoreCount} / {total} 문제를 맞혔어요!
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            {questions.slice(0, 3).map(tq => {
              const user = testAnswers[tq.id]
              const ok   = user === tq.correct
              return (
                <div key={tq.id}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-[11px]',
                    ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  )}>
                  <span>{ok ? '✅' : '❌'}</span>
                  <span className="font-semibold flex-1">{tq.label}</span>
                  <span className="text-[10px] opacity-60 shrink-0">
                    {tq.choices.find(c => c.v === user)?.label}
                  </span>
                </div>
              )
            })}
            <div className="mt-1 px-3 py-2 rounded-xl bg-indigo-50 text-[11px] text-indigo-600 text-center">
              내 예측: {questions[3]?.choices.find(c => c.v === testAnswers['prediction'])?.icon}{' '}
              {questions[3]?.choices.find(c => c.v === testAnswers['prediction'])?.label} →
              시뮬레이션에서 직접 확인해봐요!
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="px-5 pt-3 pb-1 overflow-y-auto flex-1">
        <div className="flex items-start justify-between mb-1.5">
          <div>
            <StepBadge />
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[13px] font-bold text-gray-900">{q.label}</p>
              <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0">
                {testQIdx + 1} / {questions.length}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">💡 {q.hint}</p>
          </div>
        </div>

        {/* 진행 도트 */}
        <div className="flex gap-1 mb-2.5">
          {questions.map((_, i) => (
            <div key={i} className={clsx(
              'h-1 rounded-full transition-all duration-300',
              i < testQIdx  ? 'flex-none w-6 bg-indigo-400' :
              i === testQIdx ? 'flex-1 bg-indigo-500' :
              'flex-none w-4 bg-gray-200'
            )} />
          ))}
        </div>

        <div className={clsx('grid gap-1.5', q.choices.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
          {q.choices.map(c => (
            <button
              key={c.v}
              onClick={() => {
                const next = { ...testAnswers, [q.id]: c.v }
                setTestAnswers(next)
                if (testQIdx < questions.length - 1) {
                  setTimeout(() => setTestQIdx(testQIdx + 1), 280)
                } else {
                  setTestDone(true)
                  markStepDone()
                }
              }}
              className={clsx(
                'flex flex-col items-center py-2.5 rounded-xl border-2 transition-all active:scale-95',
                testAnswers[q.id] === c.v
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
              )}
            >
              <span className="text-xl">{c.icon}</span>
              <span className="text-[10px] font-semibold text-gray-700 mt-0.5 text-center leading-tight px-1">
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  /* ── 렌더 ───────────────────────────────────────────────── */
  return (
    <AnimatePresence mode="wait">
      <>
        {/* ── 스포트라이트 오버레이 ── */}
        {hl && (
          <>
            {/* 어두운 배경 — 타깃 영역만 clip-path로 뚫림 */}
            <motion.div
              key={`spotlight-${currentStep.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position:      'fixed',
                inset:          0,
                zIndex:         44,
                pointerEvents: 'none',
                background:    'rgba(0, 0, 0, 0.45)',
                clipPath: `polygon(evenodd,
                  0px 0px, 100% 0px, 100% 100%, 0px 100%, 0px 0px,
                  ${hl.left}px ${hl.top}px,
                  ${hl.right}px ${hl.top}px,
                  ${hl.right}px ${hl.bottom}px,
                  ${hl.left}px ${hl.bottom}px,
                  ${hl.left}px ${hl.top}px
                )`,
              }}
            />

            {/* 타깃 강조 링 */}
            <motion.div
              key={`ring-${currentStep.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position:      'fixed',
                top:            hl.top,
                left:           hl.left,
                width:          hl.width,
                height:         hl.height,
                zIndex:         45,
                pointerEvents: 'none',
                borderRadius:   12,
                boxShadow:     '0 0 0 2px #818cf8, 0 0 0 6px rgba(99,102,241,0.25), 0 0 20px rgba(99,102,241,0.3)',
              }}
            />
          </>
        )}

        {/* ── 하단 패널 ── */}
        {showPanel && (
          <div
            style={{
              position:      'fixed',
              bottom:         0,
              left:           0,
              right:          0,
              zIndex:         50,
              display:       'flex',
              justifyContent: 'center',
              padding:       '0 16px',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              key={`panel-${currentStep.id}-${mode}`}
              initial={{ y: 48, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              exit={{   y: 48, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width:         '100%',
                maxWidth:       860,
                height:         PANEL_H_CSS,
                display:       'flex',
                flexDirection: 'column',
                pointerEvents: 'auto',
              }}
              className="bg-white rounded-t-3xl shadow-[0_-8px_48px_rgba(0,0,0,0.18)] overflow-hidden"
            >
              {/* 드래그 핸들 */}
              <div className="flex justify-center pt-2.5 flex-shrink-0">
                <div className="w-9 h-1 bg-gray-200 rounded-full" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${mode}-${testQIdx}-${testDone}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="flex flex-col overflow-hidden flex-1"
                >
                  {mode === 'mini'     && <MiniContent />}
                  {mode === 'judgment' && <JudgmentContent />}
                  {mode === 'reading'  && <ReadingContent />}
                  {mode === 'feedback' && <FeedbackContent />}
                  {mode === 'test'     && <TestContent />}
                </motion.div>
              </AnimatePresence>

              <Nav />
            </motion.div>
          </div>
        )}
      </>
    </AnimatePresence>
  )
}
