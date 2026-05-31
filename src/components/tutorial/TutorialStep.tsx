'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useTutorialStore } from '@/stores/tutorialStore'
import { useChartStore }    from '@/stores/chartStore'
import { useMobile }        from '@/hooks/useMobile'
import { calcMA, calcRSI, calcMACD } from '@/lib/indicators'
import type { TutorialStep as TStep, CandleData, IndicatorSlug } from '@/types'
import { clsx } from 'clsx'

/* ── Constants ────────────────────────────────────────────────── */
const PAD          = 6
const SCROLL_MS    = 220
const CARD_W       = 340
const CARD_MARGIN  = 14

/* ── Types ────────────────────────────────────────────────────── */
type CardMode = 'idle' | 'judgment' | 'feedback' | 'test'

interface HL {
  top: number; left: number
  width: number; height: number
  bottom: number; right: number
}
interface CardPos { top: number; left: number }

/* ── 인디케이터 이름 맵 (모바일 튜토리얼 버튼용) ─────────────── */
const INDICATOR_NAMES: Partial<Record<IndicatorSlug, string>> = {
  'moving-average': 'MA (이동평균선)',
  rsi:              'RSI',
  macd:             'MACD',
  bollinger:        'BB (볼린저밴드)',
}

/* ── Spotlight rect ───────────────────────────────────────────── */
function mkHL(el: Element): HL {
  const r = el.getBoundingClientRect()
  return {
    top:    r.top    - PAD,  left:   r.left   - PAD,
    width:  r.width  + PAD * 2, height: r.height + PAD * 2,
    bottom: r.bottom + PAD,  right:  r.right  + PAD,
  }
}

function getCardW(): number {
  if (typeof window === 'undefined') return CARD_W
  return Math.min(CARD_W, window.innerWidth - 16)
}

function calcCardPos(hl: HL, preferred: string, cardW: number, cardH: number): CardPos {
  const vw = window.innerWidth, vh = window.innerHeight
  const M  = CARD_MARGIN
  const cx = hl.left + hl.width  / 2
  const cy = hl.top  + hl.height / 2
  const clampL = (x: number) => Math.max(8, Math.min(x, vw - cardW - 8))
  const clampT = (y: number) => Math.max(56, Math.min(y, vh - cardH - 8))

  const variants: Record<string, CardPos> = {
    top:    { top: hl.top - cardH - M,    left: clampL(cx - cardW / 2) },
    bottom: { top: hl.bottom + M,         left: clampL(cx - cardW / 2) },
    right:  { top: clampT(cy - cardH / 2), left: hl.right  + M },
    left:   { top: clampT(cy - cardH / 2), left: hl.left - cardW - M },
  }
  const order = [preferred, 'top', 'right', 'left', 'bottom'].filter((v, i, a) => a.indexOf(v) === i)
  for (const pos of order) {
    const c = variants[pos]; if (!c) continue
    if (c.top >= 56 && c.top + cardH <= vh - 8 && c.left >= 8 && c.left + cardW <= vw - 8) return c
  }
  const fb = variants[preferred] ?? variants.bottom
  return { top: Math.max(56, Math.min(fb.top, vh - cardH - 8)), left: Math.max(8, Math.min(fb.left, vw - cardW - 8)) }
}

/* ── smartScroll — 모바일/PC 분기 ────────────────────────────── */
function smartScroll(step: TStep, isMobile: boolean) {
  const el = document.querySelector(step.targetSelector)
  if (!el) return
  const r  = el.getBoundingClientRect()
  // 숨겨진(hidden) 요소는 스크롤 불필요
  if (r.width === 0 && r.height === 0) return

  const vh = window.innerHeight

  if (isMobile) {
    // Safe zone: 헤더(52px) ~ 화면 55% (하단 시트 45% 확보)
    const safeBottom = vh * 0.56
    const idealTop   = 68
    if (r.top < idealTop) {
      window.scrollBy({ top: r.top - idealTop, behavior: 'smooth' })
    } else if (r.bottom > safeBottom) {
      window.scrollBy({ top: r.bottom - safeBottom + 16, behavior: 'smooth' })
    }
  } else {
    if (r.bottom > vh - 60)
      window.scrollBy({ top: r.bottom - (vh - 80), behavior: 'smooth' })
    else if (r.top < 60)
      window.scrollBy({ top: r.top - 80, behavior: 'smooth' })
  }
}

/* ══ Comprehensive test helpers ════════════════════════════════ */
function scoreTrend(c: CandleData[]): 'up' | 'sideways' | 'down' {
  if (c.length < 30) return 'sideways'
  const ma20 = calcMA(c, 20), ma60 = calcMA(c, 60)
  const n20 = ma20.length, n60 = ma60.length
  if (n20 < 10) return 'sideways'
  const d20 = ma20[n20 - 1].value - ma20[Math.max(0, n20 - 10)].value
  const d60 = n60 >= 10 ? ma60[n60 - 1].value - ma60[Math.max(0, n60 - 10)].value : 0
  if (d20 > 0 && d60 >= 0) return 'up'
  if (d20 < 0 && d60 <= 0) return 'down'
  return 'sideways'
}
function scoreRSI(c: CandleData[]): 'overbought' | 'neutral' | 'oversold' {
  const rsi = calcRSI(c)
  const v   = rsi[rsi.length - 1]?.value ?? 50
  return v >= 65 ? 'overbought' : v <= 35 ? 'oversold' : 'neutral'
}
function scoreMACDSignal(c: CandleData[]): 'bullish' | 'bearish' {
  const d    = calcMACD(c).filter(x => x.signal !== null)
  const last = d[d.length - 1]
  if (!last) return 'bearish'
  return last.macd > (last.signal ?? 0) ? 'bullish' : 'bearish'
}

interface TestQ {
  id: string; label: string; hint: string
  choices: { v: string; icon: string; label: string }[]
  correct: string | null
  feedback: Record<string, string>
}

function buildTestQs(c: CandleData[]): TestQ[] {
  return [
    {
      id: 'trend', label: '현재 추세는?', hint: 'MA 선들의 방향을 봐요',
      correct: scoreTrend(c),
      choices: [
        { v: 'up',       icon: '↑', label: '상승' },
        { v: 'sideways', icon: '→', label: '횡보' },
        { v: 'down',     icon: '↓', label: '하락' },
      ],
      feedback: {
        up:       'MA선들이 함께 우상향 중이에요. 상승 추세예요.',
        sideways: 'MA선들이 방향 없이 얽혀 있어요. 추세가 불분명해요.',
        down:     'MA선들이 함께 우하향 중이에요. 하락 추세예요.',
      },
    },
    {
      id: 'rsi', label: 'RSI 상태는?', hint: 'RSI 그래프 오른쪽 끝 값을 봐요',
      correct: scoreRSI(c),
      choices: [
        { v: 'overbought', icon: '↑', label: '과열 (70+)' },
        { v: 'neutral',    icon: '—', label: '중립' },
        { v: 'oversold',   icon: '↓', label: '침체 (30-)' },
      ],
      feedback: {
        overbought: 'RSI 65+ — 과매수 구간이에요. 조정 가능성이 있어요.',
        neutral:    'RSI 중립 구간이에요. 다른 지표와 함께 봐요.',
        oversold:   'RSI 35- — 과매도 구간이에요. 반등 가능성이 있어요.',
      },
    },
    {
      id: 'macd', label: 'MACD 상태는?', hint: '파란선·주황선 위치를 봐요',
      correct: scoreMACDSignal(c),
      choices: [
        { v: 'bullish', icon: '↑', label: '상승 모멘텀' },
        { v: 'bearish', icon: '↓', label: '하락 모멘텀' },
      ],
      feedback: {
        bullish: 'MACD선이 시그널선 위에 있어요. 상승 모멘텀이에요.',
        bearish: 'MACD선이 시그널선 아래에 있어요. 하락 압력이에요.',
      },
    },
    {
      id: 'prediction', label: '내 예측은?', hint: '정답 없음 — 자유롭게 판단해봐요',
      correct: null,
      choices: [
        { v: 'up',       icon: '↑', label: '상승' },
        { v: 'sideways', icon: '→', label: '횡보' },
        { v: 'down',     icon: '↓', label: '하락' },
      ],
      feedback: {
        up:       '상승 예측! 실전 챌린지에서 직접 확인해봐요.',
        sideways: '횡보 예측! 실전 챌린지에서 검증해봐요.',
        down:     '하락 예측! 실전 챌린지에서 맞는지 확인해봐요.',
      },
    },
  ]
}

/* ══════════════════════════════════════════════════════════════
   TutorialStep — Main Component
══════════════════════════════════════════════════════════════ */
export function TutorialStep() {
  const {
    currentStep, currentIndex, steps, isLesson,
    stepDone, candleData: clickedCandle, chosenJudgment,
    next, prev, skip, complete, completeLesson, notifyJudgment, markStepDone,
  } = useTutorialStore()
  const { activeIndicators, candleData: chartCandles, toggleIndicator } = useChartStore()

  const isMobile = useMobile()
  const isMobileRef = useRef(isMobile)
  useEffect(() => { isMobileRef.current = isMobile }, [isMobile])

  /* ── State ────────────────────────────────────────────── */
  const [hl,       setHl]       = useState<HL | null>(null)
  const [showCard, setShowCard] = useState(false)
  const [cardPos,  setCardPos]  = useState<CardPos | null>(null)

  const cardRef  = useRef<HTMLDivElement>(null)
  const stepTmr  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef   = useRef<number>(0)

  const [testQIdx,    setTestQIdx]    = useState(0)
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({})
  const [testDone,    setTestDone]    = useState(false)

  const [wrongCount,       setWrongCount]       = useState(0)
  const [showWrongFB,      setShowWrongFB]       = useState(false)
  const [wrongChoiceValue, setWrongChoiceValue]  = useState<string | null>(null)

  /* ── Derived mode ─────────────────────────────────────── */
  const mode: CardMode =
    !currentStep                                          ? 'idle' :
    currentStep.actionRequired === 'comprehensive-test'   ? 'test' :
    stepDone                                              ? 'feedback' :
    currentStep.actionRequired === 'judgment'             ? 'judgment' :
    'idle'

  /* ── Spotlight 공통 계산 ─────────────────────────────── */
  const computeHL = useCallback(() => {
    if (!currentStep) return null
    const el = document.querySelector(currentStep.targetSelector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    // 숨겨진(display:none) 요소 = 크기 0 → 스포트라이트 없음
    if (r.width === 0 && r.height === 0) return null
    const vh = window.innerHeight
    if (r.bottom < 0 || r.top > vh) return null
    return mkHL(el)
  }, [currentStep])

  /* ── Recompute (PC 전용 위치 계산 포함) ──────────────── */
  const recompute = useCallback(() => {
    if (!currentStep || !showCard) return

    const hlRect = computeHL()
    setHl(hlRect)

    // 모바일: 위치 계산 불필요 (고정 하단 시트)
    if (isMobileRef.current) return

    if (!cardRef.current) return
    const cardW = getCardW()
    const cardH = cardRef.current.offsetHeight
    if (cardH === 0) return

    const vw = window.innerWidth
    const vh = window.innerHeight

    // floatSide: 뷰포트 우하단 고정 (PC 전용)
    if (currentStep.floatSide) {
      const M = 16
      setCardPos(
        vw >= 768
          ? { left: vw - cardW - M, top: Math.max(56, vh - cardH - M) }
          : { left: Math.max(M, (vw - cardW) / 2), top: Math.max(56, vh - cardH - M) }
      )
      return
    }

    if (!hlRect) {
      setCardPos({ top: 72, left: Math.max(8, (vw - cardW) / 2) })
      return
    }
    setCardPos(calcCardPos(hlRect, currentStep.position, cardW, cardH))
  }, [currentStep, showCard, computeHL])

  /* ── Step 변경 ────────────────────────────────────────── */
  useEffect(() => {
    if (!currentStep) { setHl(null); setShowCard(false); setCardPos(null); return }

    if (stepTmr.current) clearTimeout(stepTmr.current)
    cancelAnimationFrame(rafRef.current)

    setShowCard(false); setHl(null); setCardPos(null)
    setTestQIdx(0); setTestAnswers({}); setTestDone(false)
    setWrongCount(0); setShowWrongFB(false); setWrongChoiceValue(null)

    smartScroll(currentStep, isMobileRef.current)

    stepTmr.current = setTimeout(() => setShowCard(true), SCROLL_MS)
    return () => { if (stepTmr.current) clearTimeout(stepTmr.current) }
  }, [currentStep]) // eslint-disable-line

  /* ── 카드 표시 후 측정 + 위치 (PC) ──────────────────── */
  useEffect(() => {
    if (!showCard) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => recompute())
    })
    return () => cancelAnimationFrame(rafRef.current)
  }, [showCard, recompute])

  /* ── ResizeObserver (PC 카드 높이 변화 감지) ──────────── */
  useEffect(() => {
    if (!cardRef.current || !showCard) return
    const obs = new ResizeObserver(() => recompute())
    obs.observe(cardRef.current)
    return () => obs.disconnect()
  }, [showCard, recompute])

  /* ── Scroll / resize ──────────────────────────────────── */
  useEffect(() => {
    const h = () => recompute()
    window.addEventListener('scroll', h, { passive: true })
    window.addEventListener('resize', h)
    return () => { window.removeEventListener('scroll', h); window.removeEventListener('resize', h) }
  }, [recompute])

  /* ── Indicator-toggle detection ──────────────────────── */
  useEffect(() => {
    if (!currentStep ||
        currentStep.actionRequired !== 'indicator-toggle' ||
        !currentStep.indicatorKey || stepDone) return
    if (activeIndicators.has(currentStep.indicatorKey as any)) markStepDone()
  }, [activeIndicators, currentStep, stepDone, markStepDone])

  if (!currentStep) return null

  const isLast  = currentIndex === steps.length - 1
  const canNext =
    !currentStep.actionRequired ||
    currentStep.actionRequired === 'free' ||
    (currentStep.actionRequired === 'comprehensive-test' && testDone) ||
    stepDone

  /* ════════════ Sub-components ════════════════════════════ */

  /* Progress dots ─────────────────────────────────────── */
  const dotRow = (
    <div className="flex items-center justify-between px-4 pt-3 pb-1">
      <div className="flex gap-[3px] items-center flex-wrap">
        {steps.map((_, i) => (
          <div key={i} className={clsx(
            'rounded-full transition-all duration-300',
            i < currentIndex   ? 'w-[5px] h-[5px] bg-navi-action/60' :
            i === currentIndex ? 'w-2 h-2 bg-navi-action'             :
            'w-[5px] h-[5px] bg-navi-border2'
          )} />
        ))}
      </div>
      <span className="text-[10px] tabular-nums ml-2 shrink-0 text-quiet-45">
        {currentIndex + 1} / {steps.length}
      </span>
    </div>
  )

  /* Nav row (PC) ──────────────────────────────────────── */
  const navRow = (
    <div className="flex items-center justify-between px-4 py-3 border-t border-navi-border/40">
      <button
        onClick={skip}
        className="text-[10px] text-quiet-35 hover:text-navi-secondary transition-colors"
      >
        건너뛰기
      </button>
      <div className="flex gap-1.5 items-center">
        {currentIndex > 0 && (
          <button
            onClick={prev}
            className="w-6 h-6 flex items-center justify-center rounded-md
                       text-[11px] text-navi-muted border border-navi-border2
                       hover:text-navi-text hover:border-navi-border transition"
          >←</button>
        )}
        {!isLast ? (
          <button
            onClick={canNext ? next : undefined}
            disabled={!canNext}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
              canNext
                ? 'bg-navi-action text-white hover:bg-navi-action-hover active:scale-95 cursor-pointer shadow-[0_2px_12px_rgba(91,127,255,0.3)]'
                : 'bg-navi-surface3 text-navi-disabled cursor-not-allowed'
            )}
          >
            {canNext ? '다음 →' : '먼저 해보세요'}
          </button>
        ) : isLesson ? (
          <button onClick={completeLesson}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-navi-action text-white hover:bg-navi-action-hover transition active:scale-95 shadow-[0_2px_12px_rgba(91,127,255,0.35)]">
            학습 완료
          </button>
        ) : (
          <button onClick={complete}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-navi-action text-white hover:bg-navi-action-hover transition active:scale-95 shadow-[0_2px_12px_rgba(91,127,255,0.35)]">
            기초 과정 완료
          </button>
        )}
      </div>
    </div>
  )

  /* Nav row (Mobile — 터치 타깃 확대) ──────────────────── */
  const mobileNavRow = (
    <div className="flex items-center justify-between px-4 py-3.5 border-t border-navi-border/40">
      <button
        onClick={skip}
        className="text-[12px] text-quiet-35 hover:text-navi-secondary transition-colors py-1"
      >
        건너뛰기
      </button>
      <div className="flex gap-2 items-center">
        {currentIndex > 0 && (
          <button
            onClick={prev}
            className="w-9 h-9 flex items-center justify-center rounded-xl
                       text-[13px] text-navi-muted border border-navi-border2
                       hover:text-navi-text hover:border-navi-border transition"
          >←</button>
        )}
        {!isLast ? (
          <button
            onClick={canNext ? next : undefined}
            disabled={!canNext}
            className={clsx(
              'px-5 h-9 rounded-xl text-[12px] font-semibold transition-all',
              canNext
                ? 'bg-navi-action text-white hover:bg-navi-action-hover active:scale-95 cursor-pointer shadow-[0_2px_12px_rgba(91,127,255,0.3)]'
                : 'bg-navi-surface3 text-navi-disabled cursor-not-allowed'
            )}
          >
            {canNext ? '다음 →' : '먼저 해보세요'}
          </button>
        ) : isLesson ? (
          <button onClick={completeLesson}
            className="px-5 h-9 rounded-xl text-[12px] font-semibold bg-navi-action text-white hover:bg-navi-action-hover transition active:scale-95 shadow-[0_2px_12px_rgba(91,127,255,0.35)]">
            학습 완료
          </button>
        ) : (
          <button onClick={complete}
            className="px-5 h-9 rounded-xl text-[12px] font-semibold bg-navi-action text-white hover:bg-navi-action-hover transition active:scale-95 shadow-[0_2px_12px_rgba(91,127,255,0.35)]">
            기초 과정 완료
          </button>
        )}
      </div>
    </div>
  )

  /* IDLE content ───────────────────────────────────────── */
  const idleContent = (
    <div className="px-4 py-3.5 space-y-3">
      <p className="text-[14px] font-bold text-navi-text leading-snug">
        {currentStep.title}
      </p>
      {currentStep.body && (
        <p className="text-[12px] text-navi-secondary leading-relaxed whitespace-pre-line">
          {currentStep.body}
        </p>
      )}
      {currentStep.tips && currentStep.tips.length > 0 && (
        <ul className="bg-navi-surface2 rounded-lg p-3 space-y-1.5">
          {currentStep.tips.map((tip, i) => (
            <li key={i} className="flex gap-2 text-[12px] text-navi-secondary">
              <span className="text-navi-muted shrink-0 mt-px">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
      {currentStep.mission && (
        <div className="bg-navi-action/[0.09] border border-navi-action/25 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.3 }}
              className="w-1.5 h-1.5 rounded-full bg-navi-action"
            />
            <span className="text-[10px] font-bold text-navi-action uppercase tracking-[0.06em]">
              지금 해보세요
            </span>
          </div>
          <p className="text-[12px] text-navi-text leading-snug">{currentStep.mission}</p>
        </div>
      )}

      {/* 모바일 전용: indicator-toggle 단계에서 인라인 켜기 버튼 */}
      {isMobile && currentStep.actionRequired === 'indicator-toggle' && currentStep.indicatorKey && !stepDone && (
        <button
          onClick={() => toggleIndicator(currentStep.indicatorKey as IndicatorSlug)}
          className="w-full py-3 rounded-xl bg-navi-action text-white
                     text-[13px] font-bold transition-all active:scale-[0.97]
                     shadow-[0_4px_16px_rgba(91,127,255,0.3)]"
        >
          {INDICATOR_NAMES[currentStep.indicatorKey as IndicatorSlug] ?? currentStep.indicatorKey} 켜기
        </button>
      )}
    </div>
  )

  /* 판단 클릭 핸들러 ───────────────────────────────────── */
  function handleJudgmentClick(value: string) {
    if (!currentStep?.judgment) return
    const { correctValue } = currentStep.judgment
    if (correctValue !== undefined) {
      if (value === correctValue) {
        setWrongCount(0); setShowWrongFB(false); setWrongChoiceValue(null)
        notifyJudgment(value)
      } else {
        setWrongCount(c => c + 1)
        setWrongChoiceValue(value)
        setShowWrongFB(true)
      }
    } else {
      notifyJudgment(value)
    }
  }

  /* JUDGMENT content ───────────────────────────────────── */
  const judgmentContent = currentStep.judgment ? (
    <div className="px-4 py-3 space-y-2">
      <p className="text-[14px] font-bold text-navi-text leading-snug">{currentStep.title}</p>
      <p className="text-[12px] text-navi-secondary">{currentStep.judgment.question}</p>

      <AnimatePresence mode="wait">
        {showWrongFB ? (
          <motion.div key="wrong-feedback"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="space-y-2"
          >
            <div className="bg-navi-danger/[0.08] border border-navi-danger/25 rounded-lg p-3">
              <p className="text-[12px] font-semibold text-navi-text mb-1.5">❌ 다시 살펴보세요</p>
              {wrongChoiceValue && (() => {
                const chosen = currentStep.judgment!.choices.find(c => c.value === wrongChoiceValue)
                return chosen ? (
                  <p className="text-[11.5px] text-navi-secondary leading-relaxed">
                    {chosen.label} — {chosen.feedback}
                  </p>
                ) : null
              })()}
            </div>
            {currentStep.judgment.hints && currentStep.judgment.hints.length > 0 && (
              <div className="bg-navi-surface3 rounded-lg px-3 py-2.5">
                <p className="text-[9.5px] font-bold text-navi-muted uppercase tracking-[0.08em] mb-1.5">힌트</p>
                {currentStep.judgment.hints.map((h, i) => (
                  <p key={i} className="text-[11.5px] text-navi-secondary leading-snug">• {h}</p>
                ))}
              </div>
            )}
            <button
              onClick={() => { setShowWrongFB(false); setWrongChoiceValue(null) }}
              className={clsx(
                'w-full py-2.5 rounded-lg text-[12px] font-semibold',
                'border border-navi-border2 text-navi-text',
                'hover:border-navi-action/40 hover:bg-navi-action/[0.06]',
                'transition-all active:scale-[0.98]',
                isMobile && 'py-3.5 text-[13px] rounded-xl'
              )}
            >
              다시 시도 →
            </button>
            {wrongCount >= 2 && (
              <button
                onClick={() => { notifyJudgment(currentStep.judgment!.correctValue!); setShowWrongFB(false) }}
                className="w-full py-1.5 text-[11px] text-navi-muted hover:text-navi-secondary transition-colors text-center"
              >
                정답 보기
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div key="choices"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="space-y-1.5"
          >
            {currentStep.judgment.choices.map(c => (
              <button
                key={c.value}
                onClick={() => handleJudgmentClick(c.value)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 rounded-lg text-left',
                  'border border-navi-border2 transition-all',
                  'hover:border-navi-action/40 hover:bg-navi-action/[0.06]',
                  'active:scale-[0.98]',
                  isMobile ? 'py-3.5 rounded-xl' : 'py-2.5'
                )}
              >
                <span className="text-[15px] font-bold shrink-0 leading-none text-navi-text w-5 text-center">
                  {c.icon}
                </span>
                <span className={clsx('font-medium text-navi-text', isMobile ? 'text-[13px]' : 'text-[12px]')}>
                  {c.label}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  ) : null

  /* FEEDBACK content ───────────────────────────────────── */
  const feedbackContent = (
    <div className="px-4 py-3.5 space-y-2.5">
      <p className="text-[14px] font-bold text-navi-text leading-snug">{currentStep.title}</p>

      {currentStep.actionRequired === 'judgment' &&
       currentStep.judgment && chosenJudgment && (() => {
         const chosen     = currentStep.judgment!.choices.find(c => c.value === chosenJudgment)
         const isCorrect  = currentStep.judgment!.correctValue !== undefined
                            && chosenJudgment === currentStep.judgment!.correctValue
         return chosen ? (
           <div className={clsx(
             'rounded-lg p-3',
             isCorrect ? 'bg-navi-success/[0.07] border border-navi-success/25'
                       : 'bg-navi-info/[0.07] border border-navi-info/25',
           )}>
             <div className="flex items-center gap-2 mb-1.5">
               {isCorrect && <span className="text-[11px] font-bold text-navi-success">✓</span>}
               <span className="text-[14px] font-bold leading-none text-navi-text">{chosen.icon}</span>
               <span className="text-[12px] font-semibold text-navi-text">{chosen.label}</span>
             </div>
             <p className="text-[12px] text-navi-secondary leading-relaxed">{chosen.feedback}</p>
           </div>
         ) : null
       })()}

      {clickedCandle && currentStep.actionRequired === 'candle-click' && (
        <div className="bg-navi-surface2 rounded-lg p-2.5">
          <p className="text-[10px] text-navi-muted mb-2 font-semibold uppercase tracking-wide">
            {clickedCandle.time}
          </p>
          <div className="grid grid-cols-5 gap-1">
            {[
              { label: '시가',  value: `$${clickedCandle.open.toFixed(1)}`,   type: 'neutral' as const },
              { label: '고가',  value: `$${clickedCandle.high.toFixed(1)}`,   type: 'up' as const },
              { label: '저가',  value: `$${clickedCandle.low.toFixed(1)}`,    type: 'down' as const },
              { label: '종가',  value: `$${clickedCandle.close.toFixed(1)}`,  type: 'neutral' as const },
              {
                label: '등락',
                value: `${clickedCandle.close >= clickedCandle.open ? '+' : ''}${
                  ((clickedCandle.close - clickedCandle.open) / clickedCandle.open * 100).toFixed(1)
                }%`,
                type: (clickedCandle.close >= clickedCandle.open ? 'up' : 'down') as 'up' | 'down',
              },
            ].map(({ label, value, type }) => (
              <div key={label} className={clsx(
                'flex flex-col items-center rounded px-0.5 py-1.5',
                type === 'up'   ? 'bg-navi-success/[0.08] border border-navi-success/20' :
                type === 'down' ? 'bg-navi-danger/[0.08]  border border-navi-danger/20'  :
                'bg-navi-surface3'
              )}>
                <span className="text-[10px] text-navi-secondary">{label}</span>
                <span className="text-[12px] font-bold mt-0.5 text-navi-text">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentStep.completionMessage && (
        <div className="bg-navi-success/[0.07] border border-navi-success/25 rounded-lg p-3">
          <p className="text-[12px] text-navi-text leading-relaxed">
            ✓ {currentStep.completionMessage}
          </p>
        </div>
      )}
    </div>
  )

  /* TEST content ───────────────────────────────────────── */
  const questions = buildTestQs(chartCandles)

  const testContent = (() => {
    if (testDone) {
      const score = questions.filter(q => q.correct && testAnswers[q.id] === q.correct).length
      const total = questions.filter(q => q.correct !== null).length
      return (
        <div className="px-4 py-3 space-y-2">
          <p className="text-[14px] font-bold text-navi-text">{score} / {total} 정답</p>
          <div className="space-y-1">
            {questions.slice(0, 3).map(q => {
              const user = testAnswers[q.id]
              const ok   = user === q.correct
              return (
                <div key={q.id} className={clsx(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px]',
                  ok ? 'bg-navi-success/[0.08] border border-navi-success/25 text-navi-text'
                     : 'bg-navi-danger/[0.08] border border-navi-danger/25 text-navi-text'
                )}>
                  <span>{ok ? '✓' : '✗'}</span>
                  <span className="flex-1 font-medium">{q.label}</span>
                  <span className="text-[10px] text-navi-secondary">
                    {q.choices.find(c => c.v === user)?.label}
                  </span>
                </div>
              )
            })}
            <div className="bg-navi-info/[0.07] text-navi-text text-[12px] text-center py-2 rounded-lg border border-navi-info/25">
              내 예측: {questions[3]?.choices.find(c => c.v === testAnswers['prediction'])?.label}
              {' '}→ 시뮬레이션에서 확인해봐요
            </div>
          </div>
        </div>
      )
    }

    const q = questions[testQIdx]
    return (
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12.5px] font-bold text-navi-text">{q.label}</p>
          <span className="shrink-0 text-[9px] font-bold text-navi-text
                           bg-navi-surface3 px-1.5 py-0.5 rounded-full border border-navi-border2">
            {testQIdx + 1} / {questions.length}
          </span>
        </div>
        <p className="text-[11px] text-navi-muted">힌트 · {q.hint}</p>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={clsx(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i < testQIdx   ? 'bg-navi-action'      :
              i === testQIdx ? 'bg-navi-action/40'   :
              'bg-navi-border2'
            )} />
          ))}
        </div>
        <div className={clsx('grid gap-1.5', q.choices.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
          {q.choices.map(c => (
            <button
              key={c.v}
              onClick={() => {
                const updated = { ...testAnswers, [q.id]: c.v }
                setTestAnswers(updated)
                if (testQIdx < questions.length - 1) {
                  setTimeout(() => setTestQIdx(i => i + 1), 260)
                } else {
                  setTestDone(true); markStepDone()
                }
              }}
              className={clsx(
                'flex flex-col items-center rounded-lg border-2 transition-all active:scale-95',
                isMobile ? 'py-4' : 'py-3',
                testAnswers[q.id] === c.v
                  ? 'border-navi-action/70 bg-navi-action/[0.10]'
                  : 'border-navi-border2 hover:border-navi-action/35 hover:bg-navi-action/[0.04]'
              )}
            >
              <span className="text-[18px] font-bold leading-none text-navi-text">{c.icon}</span>
              <span className="text-[11px] font-semibold text-navi-text mt-1.5 text-center leading-tight px-0.5">
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  })()

  /* ── 공통 콘텐츠 렌더러 ──────────────────────────────── */
  const contentBlock = (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${mode}-${testQIdx}-${String(testDone)}-${String(showWrongFB)}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
      >
        {mode === 'idle'     && idleContent}
        {mode === 'judgment' && (judgmentContent ?? idleContent)}
        {mode === 'feedback' && feedbackContent}
        {mode === 'test'     && testContent}
      </motion.div>
    </AnimatePresence>
  )

  /* ══════════════════════════ RENDER ══════════════════════════ */
  return (
    <AnimatePresence>
      <>
        {/* ── Dim overlay (with spotlight cutout) ── */}
        {hl && (
          <motion.div
            key={`overlay-${currentStep.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 44, pointerEvents: 'none',
              background: 'rgba(0,0,0,0.54)',
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
        )}

        {/* ── Spotlight glow ring ── */}
        {hl && (
          <motion.div
            key={`ring-${currentStep.id}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, delay: 0.06 }}
            style={{
              position: 'fixed',
              top: hl.top, left: hl.left, width: hl.width, height: hl.height,
              zIndex: 45, pointerEvents: 'none', borderRadius: 10,
              boxShadow: '0 0 0 1.5px #2D4198, 0 0 0 5px rgba(45,65,152,0.25), 0 0 28px rgba(45,65,152,0.45)',
            }}
          />
        )}

        {showCard && (
          isMobile ? (
            /* ════ 모바일: 고정 Bottom Sheet ════ */
            <motion.div
              key={`mobile-card-${currentStep.id}`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
                maxHeight: '48vh',
                display: 'flex', flexDirection: 'column',
              }}
              className="bg-navi-surface border-t border-navi-border rounded-t-2xl overflow-hidden"
            >
              {/* 드래그 핸들 */}
              <div className="flex-shrink-0 flex justify-center pt-2 pb-0.5">
                <div className="w-8 h-[3px] rounded-full bg-navi-border2" />
              </div>

              {/* Progress dots */}
              <div className="flex-shrink-0">
                {dotRow}
              </div>

              {/* 스크롤 가능한 콘텐츠 */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {contentBlock}
              </div>

              {/* 모바일 네비 (터치 타깃 확대) */}
              <div className="flex-shrink-0">
                {mobileNavRow}
              </div>
            </motion.div>
          ) : (
            /* ════ PC: 플로팅 카드 ════ */
            <div
              ref={cardRef}
              style={{
                position: 'fixed',
                width: getCardW(),
                top:  cardPos?.top  ?? -9999,
                left: cardPos?.left ?? -9999,
                zIndex: 50,
                maxWidth: 'calc(100vw - 16px)',
              }}
            >
              <motion.div
                key={`card-${currentStep.id}`}
                initial={{ opacity: 0, scale: 0.93, y: 10 }}
                animate={{
                  opacity: cardPos ? 1 : 0,
                  scale:   cardPos ? 1 : 0.93,
                  y:       cardPos ? 0 : 10,
                }}
                exit={{ opacity: 0, scale: 0.93, y: 10 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="bg-navi-surface border border-navi-border rounded-xl
                           shadow-[0_12px_48px_rgba(0,0,0,0.55)] overflow-hidden"
              >
                {dotRow}
                {contentBlock}
                {navRow}
              </motion.div>
            </div>
          )
        )}
      </>
    </AnimatePresence>
  )
}
