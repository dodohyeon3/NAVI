'use client'

/**
 * 사용자 여정 퍼널 시각화 (개선판)
 *
 * 핵심 수정 사항:
 *   1. 이탈 설명 로직 수정
 *      - 이탈 텍스트는 "현재 단계 → 바로 다음 단계" 기준
 *      - 이전 구현의 prevLabel + steps[i+1] 혼용 버그 제거
 *   2. 0→0 = 100% 버그 수정
 *      - prev.count=0이면 convRate=null ("–" 표시)
 *   3. 0명 상태에서 성공 색상 제거
 *   4. 단계 설명(desc) + 전환율 ⓘ 툴팁
 *   5. 클릭 시 상세 패널 (진입 인원 / 전체 방문 대비 / 이탈 인원)
 *   6. 상단 자동 요약 문장
 *   7. 모든 단계명 전체 노출 (truncate 절대 없음)
 */

import { useState } from 'react'

export interface FunnelStep {
  label:         string
  desc?:         string   // 단계 설명 (예: "서비스 첫 진입")
  event:         string
  count:         number
  convTooltip?:  string   // ⓘ 계산식 설명
}

interface Props {
  steps: FunnelStep[]
}

/** 한국어 조사 "로/으로" 자동 선택 */
function josaRo(label: string): string {
  const last = label.charCodeAt(label.length - 1)
  if (last >= 0xAC00 && last <= 0xD7A3) {
    const jongseong = (last - 0xAC00) % 28
    return jongseong === 0 || jongseong === 8 ? `${label}로` : `${label}으로`
  }
  return `${label}로`
}

export function FunnelChart({ steps }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (!steps.length) {
    return <p className="text-[12px] text-navi-muted">데이터 없음</p>
  }

  const maxCount   = Math.max(...steps.map(s => s.count), 1)
  const firstCount = steps[0].count

  /* ── 가장 큰 이탈 구간 탐색 ──────────────────────────── */
  let biggestDropIdx = 0
  let biggestDropPct = 0
  for (let k = 0; k < steps.length - 1; k++) {
    if (steps[k].count > 0) {
      const drop = 100 - Math.round((steps[k + 1].count / steps[k].count) * 100)
      if (drop > biggestDropPct) {
        biggestDropPct = drop
        biggestDropIdx = k
      }
    }
  }

  /* ── 자동 요약 계산 ──────────────────────────────────── */
  const visitCount    = steps[0].count
  const tutStart      = steps[1]?.count ?? 0
  const tutStartRate  = visitCount > 0
    ? Math.round((tutStart / visitCount) * 100)
    : 0

  /* ═══════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">

      {/* ── 자동 요약 문장 ───────────────────────── */}
      <div className="bg-navi-surface2/60 border border-navi-border/40 rounded-xl px-4 py-3">
        {visitCount > 0 ? (
          <p className="text-[12px] text-navi-secondary leading-[1.9]">
            최근 30일 기준,{' '}
            <span className="font-bold text-navi-text">
              {visitCount.toLocaleString()}명
            </span>이 방문했고,{' '}
            <span className="font-bold text-navi-text">
              {tutStart.toLocaleString()}명
            </span>이 튜토리얼을 시작했습니다.{' '}
            튜토리얼 시작률은{' '}
            <span className="font-bold text-navi-text">{tutStartRate}%</span>입니다.
            {biggestDropPct > 5 && (
              <>
                {' '}현재 가장 큰 이탈 구간은{' '}
                <span className="font-bold text-navi-danger">
                  &quot;{steps[biggestDropIdx].label} → {steps[biggestDropIdx + 1]?.label}&quot;
                </span>{' '}
                구간({biggestDropPct}% 이탈)입니다.
              </>
            )}
          </p>
        ) : (
          <p className="text-[12px] text-navi-muted">
            PostHog API 연결 후 분석 데이터가 표시됩니다.
          </p>
        )}
      </div>

      {/* ── 퍼널 단계 목록 ──────────────────────── */}
      <div>
        {steps.map((step, i) => {
          const prevStep = steps[i - 1]
          const nextStep = steps[i + 1]

          /* --------------------------------------------------
           * 전환율: 이전 단계 → 현재 단계
           *   - i=0 → 없음 (null)
           *   - prevStep.count=0 → 계산 불가 (null) ← 핵심 버그 수정
           * -------------------------------------------------- */
          const convRate: number | null =
            i > 0 && prevStep && prevStep.count > 0
              ? Math.round((step.count / prevStep.count) * 100)
              : null

          const hasData  = step.count > 0
          const hasConv  = convRate !== null
          const isAlert  = hasConv && convRate < 60
          const widthPct = Math.round((step.count / maxCount) * 100)
          const isExp    = expanded === i

          /* --------------------------------------------------
           * 이탈 설명: 현재 단계 → 다음 단계 기준 (핵심 수정)
           *   - 현재 코드 버그: prevLabel(i-1) + steps[i+1] 혼용
           *   - 수정: step.label(i) + steps[i+1].label
           *   - step.count=0이면 null (계산 불가)
           * -------------------------------------------------- */
          const dropToNext: number | null =
            nextStep && step.count > 0
              ? 100 - Math.round((nextStep.count / step.count) * 100)
              : null

          const dropIsAlert = dropToNext !== null && dropToNext >= 40

          return (
            <div key={i}>
              {/* ── 단계 행 ── */}
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isExp}
                className={`flex items-start gap-3 py-1.5 px-2 rounded-xl cursor-pointer select-none
                  transition-colors outline-none
                  ${isExp ? 'bg-navi-surface2' : 'hover:bg-navi-surface2/50'}`}
                onClick={() => setExpanded(isExp ? null : i)}
                onKeyDown={e => e.key === 'Enter' && setExpanded(isExp ? null : i)}
              >
                {/* 번호 */}
                <span className="mt-2.5 w-5 shrink-0 text-[10px] font-bold text-navi-muted text-center">
                  {i + 1}
                </span>

                {/* 바 + 레이블 */}
                <div className="flex-1 min-w-0">
                  <div className="relative h-10 bg-navi-surface2 rounded-xl overflow-hidden">
                    {/* 색상 바 */}
                    <div
                      className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-500 ${
                        !hasData
                          ? 'bg-navi-border/25'
                          : isAlert
                          ? 'bg-navi-danger/25 border-l-2 border-navi-danger'
                          : i === 0
                          ? 'bg-navi-action/30'
                          : 'bg-navi-action/20'
                      }`}
                      style={{ width: `${Math.max(widthPct, 3)}%` }}
                    />
                    {/* 레이블 — truncate 없음 */}
                    <div className="absolute inset-0 flex items-center gap-2 px-3">
                      <span
                        className={`text-[13px] font-semibold whitespace-nowrap ${
                          !hasData
                            ? 'text-navi-muted'
                            : isAlert
                            ? 'text-navi-danger'
                            : 'text-navi-text'
                        }`}
                      >
                        {step.label}
                      </span>
                      {step.desc && (
                        <span className="text-[10px] text-navi-muted whitespace-nowrap hidden sm:inline">
                          — {step.desc}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 확장 패널 */}
                  {isExp && (
                    <div className="mt-2 grid grid-cols-3 gap-2 pb-1">
                      <div className="bg-navi-surface rounded-xl p-3 text-center">
                        <p className="text-[9px] font-bold text-navi-muted uppercase tracking-[0.06em] mb-1">
                          진입 인원
                        </p>
                        <p className="text-[18px] font-black text-navi-text leading-none">
                          {step.count.toLocaleString()}
                          <span className="text-[10px] font-normal text-navi-muted ml-0.5">명</span>
                        </p>
                      </div>
                      <div className="bg-navi-surface rounded-xl p-3 text-center">
                        <p className="text-[9px] font-bold text-navi-muted uppercase tracking-[0.06em] mb-1">
                          전체 방문 대비
                        </p>
                        <p className="text-[18px] font-black text-navi-text leading-none">
                          {firstCount > 0
                            ? `${Math.round((step.count / firstCount) * 100)}%`
                            : '–'}
                        </p>
                      </div>
                      <div className="bg-navi-surface rounded-xl p-3 text-center">
                        <p className="text-[9px] font-bold text-navi-muted uppercase tracking-[0.06em] mb-1">
                          이탈 인원
                        </p>
                        <p className="text-[18px] font-black text-navi-text leading-none">
                          {prevStep
                            ? <>
                                {Math.max(0, prevStep.count - step.count).toLocaleString()}
                                <span className="text-[10px] font-normal text-navi-muted ml-0.5">명</span>
                              </>
                            : '–'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 우측: 인원 수 + 전환율 */}
                <div className="shrink-0 text-right pt-1.5 min-w-[88px]">
                  <p className="text-[14px] font-bold text-navi-text leading-tight">
                    {step.count.toLocaleString()}명
                  </p>
                  {i > 0 && (
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {/* 전환율 텍스트 */}
                      <span
                        className={`text-[11px] font-semibold ${
                          /* prev=0 또는 계산 불가 → 회색 */
                          !hasConv
                            ? 'text-navi-muted'
                            /* count=0 & convRate=0 → 경고 */
                            : !hasData
                            ? 'text-navi-danger'
                            : isAlert
                            ? 'text-navi-danger'
                            : 'text-[#34D399]'
                        }`}
                      >
                        {!hasConv ? '–' : `${convRate}% 전환`}
                      </span>
                      {/* ⓘ 계산식 툴팁 */}
                      {step.convTooltip && hasConv && (
                        <div
                          className="relative group"
                          onClick={e => e.stopPropagation()}
                        >
                          <span className="text-[10px] text-navi-muted/50 cursor-help select-none">
                            ⓘ
                          </span>
                          <div
                            className="
                              absolute right-0 bottom-5 z-50 w-56
                              bg-[#1e2a3a] border border-[#334155]
                              rounded-xl px-3 py-2.5 shadow-xl
                              opacity-0 pointer-events-none
                              group-hover:opacity-100 group-hover:pointer-events-auto
                              transition-opacity duration-150 text-left
                            "
                          >
                            <p className="text-[11px] text-[#CBD5E1] leading-relaxed whitespace-pre-line">
                              {step.convTooltip}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── 이탈 설명: 현재(i) → 다음(i+1) 기준 ──
               *
               *   올바른 예:
               *     "홈 방문 중 86%가 튜토리얼 시작으로 이어지지 않음"
               *   이전 버그:
               *     prevLabel(steps[i-1]) + steps[i+1] 혼용
               * ─────────────────────────────────────────── */}
              {nextStep && (
                <div className="ml-10 flex items-start gap-2 py-1">
                  {/* 연결선 */}
                  <div className="flex flex-col items-center shrink-0 mt-0.5">
                    <div className="w-px h-3 bg-navi-border/50" />
                    <div className="w-1 h-1 rounded-full bg-navi-border" />
                    <div className="w-px h-3 bg-navi-border/50" />
                  </div>

                  {/* 이탈 텍스트 */}
                  {dropToNext === null ? (
                    /* step.count=0 → 계산 불가 */
                    <p className="text-[10px] text-navi-muted mt-1">데이터 없음</p>
                  ) : dropToNext <= 0 ? (
                    /* 이탈 없음 */
                    <p className="text-[11px] text-[#34D399] mt-1"> 전원 다음 단계로 이동</p>
                  ) : (
                    /* 이탈 있음 — step.label(현재) + nextStep.label(다음) */
                    <p
                      className={`text-[11px] mt-1 leading-snug ${
                        dropIsAlert ? 'text-navi-danger font-medium' : 'text-navi-muted'
                      }`}
                    >
                      {dropIsAlert && ' '}
                      <span className="font-semibold">{step.label}</span> 중{' '}
                      <span className="font-bold">{dropToNext}%</span>가{' '}
                      {josaRo(nextStep.label)} 이어지지 않음
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
