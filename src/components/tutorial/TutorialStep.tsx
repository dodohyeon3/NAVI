'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ProgressDots } from '@/components/ui/ProgressDots'
import { useTutorialStore } from '@/stores/tutorialStore'
import { useChartStore }    from '@/stores/chartStore'
import type { TutorialStep as TStep } from '@/types'

/* ─── 상수 ────────────────────────────────────────────────── */
const GAP       = 12
const MARGIN    = 12
const PAD       = 6
const NAV_H     = 68
const SCROLL_MS = 400

/* ─── 타입 ────────────────────────────────────────────────── */
interface PopupPos {
  top: number; left: number; width: number
  maxH: number; dir: 'top' | 'bottom' | 'left' | 'right'
  arrowX: number; arrowY: number
}
interface HighlightRect {
  top: number; left: number; width: number; height: number
}

function popupWidth() { return Math.min(440, window.innerWidth - MARGIN * 2) }

function estimateH(step: TStep): number {
  let h = 28 + 44 + (step.tips?.length ?? 0) * 26 + NAV_H + 32
  // 판단 UI: 3개 선택지 × 44px + 질문 높이
  if (step.actionRequired === 'judgment') h += 44 + 3 * 44
  // 캔들 OHLC 카드
  if (step.actionRequired === 'candle-click') h += 80
  // 완료 메시지
  if (step.completionMessage) h += 52
  return h
}

function scrollToTarget(step: TStep): boolean {
  const el = document.querySelector(step.targetSelector)
  if (!el) return false
  const vh   = window.innerHeight
  const rect = el.getBoundingClientRect()
  let targetScrollY: number
  if (step.position === 'bottom')      targetScrollY = window.scrollY + rect.top    - vh * 0.18
  else if (step.position === 'top')    targetScrollY = window.scrollY + rect.bottom - vh * 0.78
  else                                 targetScrollY = window.scrollY + rect.top + rect.height / 2 - vh * 0.45
  window.scrollTo({ top: Math.max(0, targetScrollY), behavior: 'smooth' })
  return true
}

function calcPos(step: TStep): { pos: PopupPos; highlight: HighlightRect | null } {
  const el   = document.querySelector(step.targetSelector)
  const vh   = window.innerHeight
  const vw   = window.innerWidth
  const w    = popupWidth()
  const estH = estimateH(step)

  if (!el) {
    const top = Math.max(MARGIN, (vh - estH) / 2)
    return { pos: { top, left: (vw - w) / 2, width: w, maxH: vh - top - MARGIN, dir: 'bottom', arrowX: w / 2, arrowY: 0 }, highlight: null }
  }

  const rect = el.getBoundingClientRect()
  const highlight: HighlightRect = { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }

  const spaceBottom = vh - rect.bottom - GAP
  const spaceTop    = rect.top  - GAP
  const spaceRight  = vw - rect.right - GAP
  const spaceLeft   = rect.left - GAP

  let dir = step.position
  if (dir === 'bottom' && spaceBottom < estH  && spaceTop    > spaceBottom) dir = 'top'
  if (dir === 'top'    && spaceTop    < estH  && spaceBottom > spaceTop)    dir = 'bottom'
  if (dir === 'right'  && spaceRight  < w     && spaceLeft   > spaceRight)  dir = 'left'
  if (dir === 'left'   && spaceLeft   < w     && spaceRight  > spaceLeft)   dir = 'right'
  if ((dir === 'left'  || dir === 'right') && w > vw * 0.55) dir = spaceBottom >= spaceTop ? 'bottom' : 'top'

  let rawTop: number, rawLeft: number
  if      (dir === 'bottom') { rawTop = rect.bottom + GAP;                      rawLeft = rect.left + rect.width / 2 - w / 2 }
  else if (dir === 'top')    { rawTop = rect.top - estH - GAP;                  rawLeft = rect.left + rect.width / 2 - w / 2 }
  else if (dir === 'right')  { rawTop = rect.top + rect.height / 2 - estH / 2;  rawLeft = rect.right + GAP }
  else                       { rawTop = rect.top + rect.height / 2 - estH / 2;  rawLeft = rect.left - w - GAP }

  const cLeft = Math.max(MARGIN, Math.min(rawLeft, vw - w - MARGIN))
  const cTop  = Math.max(MARGIN, Math.min(rawTop,  vh - NAV_H - MARGIN))
  const maxH  = Math.max(NAV_H + 120, vh - cTop - MARGIN)

  const arrowX = (dir === 'bottom' || dir === 'top')
    ? Math.max(16, Math.min(rect.left + rect.width  / 2 - cLeft, w    - 16)) : 0
  const arrowY = (dir === 'left'   || dir === 'right')
    ? Math.max(16, Math.min(rect.top  + rect.height / 2 - cTop,  estH - 16)) : 0

  return { pos: { top: cTop, left: cLeft, width: w, maxH, dir, arrowX, arrowY }, highlight }
}

/* ═══════════════════════════════════════════════════════════════
   컴포넌트
═══════════════════════════════════════════════════════════════ */
export function TutorialStep() {
  const {
    currentStep, currentIndex, steps,
    stepDone, candleData, chosenJudgment,
    next, prev, skip, notifyJudgment, markStepDone,
  } = useTutorialStore()

  const { activeIndicators } = useChartStore()

  const [pos, setPos] = useState<PopupPos | null>(null)
  const [hl,  setHl]  = useState<HighlightRect | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── indicator-toggle 감지 ─────────────────────────────── */
  useEffect(() => {
    if (!currentStep ||
        currentStep.actionRequired !== 'indicator-toggle' ||
        !currentStep.indicatorKey  ||
        stepDone) return

    if (activeIndicators.has(currentStep.indicatorKey as any)) {
      markStepDone()
    }
  }, [activeIndicators, currentStep, stepDone, markStepDone])

  /* ── 위치 재계산 ────────────────────────────────────────── */
  const recompute = useCallback(() => {
    if (!currentStep) { setPos(null); setHl(null); return }
    const { pos, highlight } = calcPos(currentStep)
    setPos(pos); setHl(highlight)
  }, [currentStep])

  /* ── 단계 변경 → 스크롤 → 위치 계산 ─────────────────────── */
  useEffect(() => {
    if (!currentStep) { setPos(null); setHl(null); return }
    if (timerRef.current) clearTimeout(timerRef.current)
    setPos(null); setHl(null)
    const hasEl = scrollToTarget(currentStep)
    timerRef.current = setTimeout(() => {
      const { pos, highlight } = calcPos(currentStep)
      setPos(pos); setHl(highlight)
    }, hasEl ? SCROLL_MS : 0)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [currentStep]) // eslint-disable-line react-hooks/exhaustive-deps

  // stepDone 변화 시 팝업 크기 재계산 (OHLC 카드 등 높이가 달라짐)
  useEffect(() => { recompute() }, [stepDone, recompute])

  useEffect(() => {
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [recompute])

  if (!currentStep) return null
  const isLast = currentIndex === steps.length - 1

  /* ── 진행 가능 여부 ─────────────────────────────────────── */
  const canAdvance =
    !currentStep.actionRequired ||
    currentStep.actionRequired === 'free' ||
    stepDone

  /* ────────────────────────────────────────────────────────
     BODY
  ──────────────────────────────────────────────────────── */
  const Body = ({ maxH }: { maxH?: number }) => (
    <div className="overflow-y-auto" style={maxH ? { maxHeight: Math.max(120, maxH) } : undefined}>
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
              {currentIndex + 1} / {steps.length}
            </span>
            {/* 안전 메시지 */}
            <span className="text-[9px] text-gray-400">어떤 버튼도 안전해요 🙂</span>
          </div>
          <p className="font-bold text-gray-900 text-[15px] leading-snug">{currentStep.title}</p>
        </div>
        <button
          onClick={skip}
          className="text-gray-300 hover:text-gray-400 text-[11px] shrink-0 mt-0.5 transition-colors"
        >
          건너뛰기
        </button>
      </div>

      {/* 본문 (줄바꿈 처리) */}
      <div className="text-[12.5px] text-gray-500 leading-relaxed whitespace-pre-line">
        {currentStep.body}
      </div>

      {/* 팁 목록 */}
      {currentStep.tips && currentStep.tips.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-2xl bg-gray-50 p-3">
          {currentStep.tips.map((tip, i) => (
            <li key={i} className="flex gap-2 text-[11.5px] text-gray-600 leading-relaxed">
              <span className="text-indigo-300 shrink-0 mt-px">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}

      {/* ── 인터랙티브 섹션 ──────────────────────────────── */}

      {/* 미션 박스 (행동 대기 중) */}
      {currentStep.mission && !stepDone && (
        <div className="mt-3 rounded-2xl bg-indigo-50 border border-indigo-100 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">🎯 지금 해보세요</span>
          </div>
          <p className="text-[12px] text-indigo-700 leading-relaxed">{currentStep.mission}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[10px] text-indigo-400">행동을 기다리는 중...</span>
          </div>
        </div>
      )}

      {/* 3지선다 판단 UI (judgment) */}
      {currentStep.actionRequired === 'judgment' && currentStep.judgment && (
        <div className="mt-3">
          {!stepDone ? (
            <>
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
                    <span className="text-lg">{choice.icon}</span>
                    <span className="text-[12px] font-medium text-gray-700 group-hover:text-indigo-700">
                      {choice.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* 선택 후 피드백 */
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-indigo-50 border border-indigo-100 p-3"
              >
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
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}

      {/* 캔들 OHLC 카드 (candle-click 완료 후) */}
      {stepDone && candleData && currentStep.actionRequired === 'candle-click' && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 p-3"
          >
            <p className="text-[10px] font-bold text-slate-500 mb-2">
              📊 클릭한 날 ({candleData.time})
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: '시가', value: `$${candleData.open.toFixed(2)}`,  color: '' },
                { label: '고가', value: `$${candleData.high.toFixed(2)}`,  color: '#10b981' },
                { label: '저가', value: `$${candleData.low.toFixed(2)}`,   color: '#ef4444' },
                { label: '종가', value: `$${candleData.close.toFixed(2)}`, color: '' },
                {
                  label: '변동',
                  value: `${candleData.close >= candleData.open ? '+' : ''}${((candleData.close - candleData.open) / candleData.open * 100).toFixed(1)}%`,
                  color: candleData.close >= candleData.open ? '#10b981' : '#ef4444',
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center bg-white rounded-lg px-2 py-1.5">
                  <span className="text-[9px] text-slate-400">{label}</span>
                  <span className="text-[11px] font-bold mt-0.5" style={color ? { color } : { color: '#374151' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* 완료 메시지 */}
      {stepDone && currentStep.completionMessage && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-2xl bg-green-50 border border-green-200 p-3 flex items-start gap-2"
          >
            <span className="text-green-500 text-sm shrink-0">✅</span>
            <p className="text-[12px] text-green-700 leading-relaxed">
              {currentStep.completionMessage}
            </p>
          </motion.div>
        </AnimatePresence>
      )}

      {/* 마지막 단계: 시뮬레이션 CTA */}
      {isLast && (
        <Link
          href="/simulate"
          onClick={skip}
          className="mt-3 flex items-center justify-center gap-2 w-full
                     py-2.5 rounded-2xl font-bold text-[13px] text-white
                     bg-gradient-to-r from-indigo-500 to-indigo-600
                     hover:from-indigo-400 hover:to-indigo-500
                     shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
        >
          🔮 시뮬레이션 도전하기
        </Link>
      )}
    </div>
  )

  /* ── 네비게이션 ─────────────────────────────────────────── */
  const Nav = () => (
    <div className="flex items-center justify-between flex-shrink-0 mt-4 pt-3 border-t border-gray-100">
      <ProgressDots total={steps.length} current={currentIndex} />
      <div className="flex gap-2 items-center">
        {currentIndex > 0 && (
          <button
            onClick={prev}
            className="px-3 py-1.5 rounded-xl text-[12px] text-gray-400 border border-gray-200
                       hover:border-gray-300 hover:text-gray-600 transition"
          >
            이전
          </button>
        )}
        {!isLast && (
          <button
            onClick={canAdvance ? next : undefined}
            title={canAdvance ? '' : '위의 행동을 완료하면 다음으로 넘어갈 수 있어요'}
            className={
              canAdvance
                ? 'px-4 py-1.5 rounded-xl text-[12px] font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition shadow-sm'
                : 'px-4 py-1.5 rounded-xl text-[12px] font-semibold bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          >
            {canAdvance ? '다음 →' : '↑ 먼저 해보세요'}
          </button>
        )}
        {isLast && (
          <button
            onClick={skip}
            className="px-4 py-1.5 rounded-xl text-[12px] font-semibold border border-gray-200 text-gray-500 hover:border-gray-300 transition"
          >
            차트 보기
          </button>
        )}
      </div>
    </div>
  )

  /* ── 렌더 ───────────────────────────────────────────────── */
  return (
    <AnimatePresence mode="wait">
      <>
        {/* 하이라이트 링 — z-45 (오버레이 위, 팝업 아래) */}
        {hl && (
          <motion.div
            key={`hl-${currentStep.id}`}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed', top: hl.top, left: hl.left,
              width: hl.width, height: hl.height,
              zIndex: 45, pointerEvents: 'none', borderRadius: 12,
              boxShadow: '0 0 0 2px #818cf8, 0 0 0 6px rgba(99,102,241,0.2)',
            }}
          />
        )}

        {/* 플로팅 팝업 — z-50 */}
        {pos && (
          <motion.div
            key={`popup-${currentStep.id}-${stepDone}`}
            initial={{ opacity: 0, scale: 0.94, y: 6 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{   opacity: 0, scale: 0.94,  y: 6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', top: pos.top, left: pos.left,
              width: pos.width, maxHeight: pos.maxH,
              zIndex: 50, display: 'flex', flexDirection: 'column',
            }}
            className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.20)] p-5"
          >
            {/* 방향 화살표 */}
            {pos.dir === 'bottom' && (
              <div style={{ position: 'absolute', top: -8, left: pos.arrowX - 8 }}
                className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white" />
            )}
            {pos.dir === 'top' && (
              <div style={{ position: 'absolute', bottom: -8, left: pos.arrowX - 8 }}
                className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white" />
            )}
            {pos.dir === 'right' && (
              <div style={{ position: 'absolute', left: -8, top: pos.arrowY - 8 }}
                className="w-0 h-0 border-t-[8px] border-b-[8px] border-r-[8px] border-t-transparent border-b-transparent border-r-white" />
            )}
            {pos.dir === 'left' && (
              <div style={{ position: 'absolute', right: -8, top: pos.arrowY - 8 }}
                className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[8px] border-t-transparent border-b-transparent border-l-white" />
            )}

            <Body maxH={pos.maxH - NAV_H - 32} />
            <Nav />
          </motion.div>
        )}
      </>
    </AnimatePresence>
  )
}
