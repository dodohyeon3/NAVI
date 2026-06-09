/**
 * learningStore.ts — 캔들·거래량 학습 시작 래퍼
 *
 * 이전: 독립 상태 머신 + 바텀시트 UI
 * 현재: tutorialStore.startDynamicLesson()를 통해 기존 튜토리얼 UX와 동일하게 동작
 *
 * chart/page.tsx 에서 useLearningStore()로 openCandleSelect / openVolumeSelect
 * 두 함수만 사용한다.
 */

import { useChartStore }    from '@/stores/chartStore'
import { useTutorialStore } from '@/stores/tutorialStore'
import { buildCandleLearningSteps } from '@/data/lessonSteps/candleLearning'
import { buildVolumeLearningSteps }  from '@/data/lessonSteps/volumeLearning'
import type { LearningHighlight, TutorialStep } from '@/types'

/**
 * filteredData 기준 인덱스 → candleData(전체) 기준 인덱스로 보정
 *
 * findBestCandlePattern / findVolumePattern 은 전달받은 배열의 인덱스를 반환한다.
 * recentLearningData() 로 잘라낸 서브셋을 사용할 경우, 반환된 인덱스는
 * 전체 candleData 기준으로 offset만큼 작다.
 * ChartContainer 는 candleData[candleIndex] 로 전체 배열을 직접 조회하므로
 * 보정하지 않으면 1980~90년대 캔들이 선택되는 버그가 발생한다.
 */
function offsetHighlight(
  hl:     LearningHighlight | null | undefined,
  offset: number,
): LearningHighlight | null | undefined {
  if (!hl || offset === 0) return hl
  return {
    ...hl,
    candleIndex:          hl.candleIndex + offset,
    prevCandleIndex:      hl.prevCandleIndex      !== undefined ? hl.prevCandleIndex      + offset : undefined,
    windowFrom:           hl.windowFrom  + offset,
    windowTo:             hl.windowTo    + offset,
    volumeHighlightIndex: hl.volumeHighlightIndex !== undefined ? hl.volumeHighlightIndex + offset : undefined,
  }
}

function offsetSteps(steps: TutorialStep[], offset: number): TutorialStep[] {
  if (offset === 0) return steps
  return steps.map(step => {
    if (step.learningHighlightOnEnter === undefined) return step
    return {
      ...step,
      learningHighlightOnEnter: offsetHighlight(step.learningHighlightOnEnter, offset),
    }
  })
}

/**
 * 학습용 데이터 기준 날짜 — 2010년 이후 데이터만 패턴 탐색에 사용
 * "전체" 기간 선택 시 1980~90년대 분할조정 가격($0.1 수준)이 포함되므로
 * 현대 차트와 맥락이 다른 패턴이 선택되는 문제를 방지한다.
 * 필터 후 200봉 미만이면 원본 데이터로 폴백.
 */
const LEARN_CUT_DATE = '2010-01-01'
const MIN_CANDLES    = 200

function recentLearningData(candleData: ReturnType<typeof useChartStore.getState>['candleData']) {
  const filtered = candleData.filter(c => c.time >= LEARN_CUT_DATE)
  return filtered.length >= MIN_CANDLES ? filtered : candleData
}

/** 캔들 패턴 학습 시작 */
export function openCandleSelect() {
  const candleData   = useChartStore.getState().candleData
  const filteredData = recentLearningData(candleData)
  const steps        = buildCandleLearningSteps(filteredData)
  if (!steps.length) {
    console.warn('[CandleLearning] 패턴을 데이터에서 찾지 못했어요.')
    return
  }
  // filteredData != candleData 이면 서브셋 인덱스 → 전체 배열 인덱스로 보정
  const offset = filteredData === candleData
    ? 0
    : candleData.findIndex(c => c.time >= LEARN_CUT_DATE)
  useTutorialStore.getState().startDynamicLesson(offsetSteps(steps, offset), 'candle-learning')
}

/** 거래량 학습 시작 */
export function openVolumeSelect() {
  const candleData   = useChartStore.getState().candleData
  const filteredData = recentLearningData(candleData)
  const steps        = buildVolumeLearningSteps(filteredData)
  if (!steps.length) {
    console.warn('[VolumeLearning] 거래량 데이터를 찾지 못했어요.')
    return
  }
  const offset = filteredData === candleData
    ? 0
    : candleData.findIndex(c => c.time >= LEARN_CUT_DATE)
  useTutorialStore.getState().startDynamicLesson(offsetSteps(steps, offset), 'volume-learning')
}

/** 하위 호환용 — 기존 useLearningStore() 호출 코드를 위한 훅 형태 래퍼 */
export function useLearningStore() {
  return {
    openCandleSelect,
    openVolumeSelect,
    /** 현재 거래량 학습 활성 여부 (VolumeChart 표시 조건에 사용) */
    get mode() {
      const key = useTutorialStore.getState().currentLessonKey
      if (key === 'volume-learning' && useTutorialStore.getState().isActive) return 'volume-active'
      if (key === 'candle-learning' && useTutorialStore.getState().isActive) return 'candle-active'
      return 'idle'
    },
  }
}
