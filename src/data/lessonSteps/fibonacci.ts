import type { TutorialStep, CandleData } from '@/types'

/**
 * 피보나치 심화 레슨 — 동적 빌더
 *
 * buildFibonacciSteps(data) 를 호출하면 현재 차트 데이터에서
 * "저점 -> 고점" 스윙을 탐지하고, 현재 가격이 어느 피보나치
 * 레벨에 위치하는지를 기반으로 퀴즈 정답을 동적으로 생성한다.
 *
 * 이전 접근(반등 확인 필요)과 달리, 현재 가격의 레벨 위치를
 * 묻기 때문에 시장 상태와 무관하게 항상 정답이 존재한다.
 */

/* ── 상수 ──────────────────────────────────────────────── */
const FIB_RATIOS = [
  { key: '236' as const, ratio: 0.236, label: '23.6%', desc: '얕은 조정 (극강 상승 추세)' },
  { key: '382' as const, ratio: 0.382, label: '38.2%', desc: '얕은 조정 (강한 상승 추세)' },
  { key:  '50' as const, ratio: 0.500, label: '50%',   desc: '중간 조정 (심리적 지지)'  },
  { key: '618' as const, ratio: 0.618, label: '61.8%', desc: '깊은 조정 (황금 비율)'    },
]

type FibKey = '236' | '382' | '50' | '618'

interface FibSwing {
  lowDate:      string
  lowPrice:     number
  highDate:     string
  highPrice:    number
  currentPrice: number  // 현재 가격 (퀴즈 정답 기준)
  fibKey:       FibKey   // 현재 가격과 가장 가까운 레벨
  focusBars:    number
}

/* ── 스윙 탐지 ─────────────────────────────────────────── */
/**
 * 데이터에서 최적의 저점-고점 스윙을 찾는다.
 *
 * 기존처럼 "반등 확인"을 요구하지 않고, 현재 가격이
 * 의미 있는 피보나치 되돌림 구간(5~95%)에 있는지만 확인한다.
 *
 * 가장 높은 점수(상승폭 x 피보나치 정확도 x 최신성)를 가진
 * 스윙을 반환한다.
 */
function findFibSwing(data: CandleData[]): FibSwing | null {
  const N = data.length
  if (N < 60) return null

  const currentPrice = data[N - 1].close

  // 최근 200봉 이내에서 고점 후보 탐색 (마지막 3봉은 제외 — "과거 고점" 필요)
  const searchFrom = Math.max(0, N - 200)

  let best: (FibSwing & { score: number }) | null = null

  for (let hiIdx = N - 4; hiIdx >= searchFrom + 20; hiIdx--) {
    const hiClose = data[hiIdx].close

    // 고점 이전 15~120봉 구간에서 스윙 저점 탐색 (종가 기준)
    let loIdx = -1, loClose = Infinity
    const loSearchFrom = Math.max(searchFrom, hiIdx - 120)
    const loSearchTo   = hiIdx - 15
    if (loSearchTo <= loSearchFrom) continue

    for (let j = loSearchFrom; j < loSearchTo; j++) {
      if (data[j].close < loClose) { loClose = data[j].close; loIdx = j }
    }
    if (loIdx < 0) continue

    const rally = (hiClose - loClose) / loClose
    if (rally < 0.12) continue   // 최소 12% 상승 필요

    const range        = hiClose - loClose
    const retracement  = (hiClose - currentPrice) / range

    // 현재 가격이 의미 있는 되돌림 구간 내에 있어야 함 (5%~95%)
    if (retracement < 0.05 || retracement > 0.95) continue

    // 가장 가까운 피보나치 레벨 선택
    let closest = FIB_RATIOS[0], closestDiff = Infinity
    for (const f of FIB_RATIOS) {
      const d = Math.abs(retracement - f.ratio)
      if (d < closestDiff) { closestDiff = d; closest = f }
    }

    // 점수: 큰 상승폭 + 레벨 정확도 + 최신성 우대
    const recencyBonus = hiIdx / N
    const score = rally * (1 - closestDiff * 5) * recencyBonus

    if (!best || score > best.score) {
      // 저점부터 현재까지 보이도록 focusBars 계산 (최대 80봉)
      const focusBars = Math.min(N - loIdx + 8, 80)
      best = {
        lowDate:      data[loIdx].time,
        lowPrice:     loClose,
        highDate:     data[hiIdx].time,
        highPrice:    hiClose,
        currentPrice,
        fibKey:       closest.key,
        focusBars,
        score,
      }
    }
  }

  return best
}

/* ── 동적 단계 생성 ────────────────────────────────────── */
export function buildFibonacciSteps(data: CandleData[]): TutorialStep[] {
  const swing = findFibSwing(data)

  // findFibSwing 실패 시: 알려진 스윙으로 현재 가격 기반 fallback
  if (!swing) {
    return buildKnownSwingSteps(
      data.length > 0 ? data[data.length - 1].close : 411
    )
  }

  return buildStepsFromSwing(swing)
}

/* ── 스윙으로 단계 생성 ────────────────────────────────── */
function buildStepsFromSwing(swing: FibSwing): TutorialStep[] {
  const { lowDate, lowPrice, highDate, highPrice,
          currentPrice, fibKey, focusBars } = swing

  const range    = highPrice - lowPrice
  const rallyPct = Math.round(range / lowPrice * 100)

  const fib236 = highPrice - range * 0.236
  const fib382 = highPrice - range * 0.382
  const fib50  = highPrice - range * 0.500
  const fib618 = highPrice - range * 0.618

  const retracement = (highPrice - currentPrice) / range

  const f  = (p: number) => '$' + p.toFixed(0)
  const fl = (p: number) => '$' + p.toFixed(2)

  const correctFibPrice =
    fibKey === '236' ? fib236 :
    fibKey === '382' ? fib382 :
    fibKey ===  '50' ? fib50  : fib618

  const correctFib = FIB_RATIOS.find(r => r.key === fibKey)!

  // 현재 가격 기준 레트레이스먼트 퍼센트 (정수)
  const retPct = Math.round(retracement * 100)

  const correctMsg: Record<FibKey, string> = {
    '236': `맞아요! 현재 가격(${fl(currentPrice)})이 23.6% 레벨(${f(fib236)}) 부근에 있어요. 추세가 극도로 강할 때 나타나는 얕은 조정이에요.`,
    '382': `맞아요! 현재 가격(${fl(currentPrice)})이 38.2% 레벨(${f(fib382)}) 부근에 있어요. 강한 추세에서 가장 자주 나타나는 되돌림 레벨이에요.`,
     '50': `맞아요! 현재 가격(${fl(currentPrice)})이 50% 레벨(${f(fib50)}) 부근에 있어요. 심리적 중간 지점에서 매수세가 유입되는지 주목해봐요.`,
    '618': `맞아요! 현재 가격(${fl(currentPrice)})이 61.8% 레벨(${f(fib618)}) 부근에 있어요. 황금 비율 레벨에서 지지를 받는지 확인해봐요.`,
  }

  const wrongMsg = (key: FibKey, price: number) =>
    fibKey === key
      ? correctMsg[key]
      : `${f(price)} 레벨은 현재 가격(${fl(currentPrice)})과 거리가 있어요. ${correctFib.label}(${f(correctFibPrice)}) 레벨을 다시 확인해봐요.`

  return [

    /* STEP 1  개념 소개 */
    {
      id:                     'fib-adv-intro',
      targetSelector:         '#drawing-tools-card',
      mobileTargetSelector:   '#drawing-toolbar',
      position:               'left',
      clearIndicatorsOnEnter: ['rsi', 'macd', 'bollinger', 'moving-average'],
      clearDrawingsOnEnter:   true,
      focusBarsFromEnd:       focusBars,
      title:                  '피보나치 심화 — 조정 구간을 예측해봐요',
      body:                   '가격이 강하게 오른 뒤 얼마나 내려갈까요?\n\n피보나치 되돌림은 이 조정 폭을 예측하는 도구예요. 저점에서 고점을 두 번 클릭하면 주요 레벨이 자동으로 그려져요.\n\n주요 레벨:\n• 38.2% — 얕은 조정 (강한 상승 추세)\n• 50% — 중간 조정 (심리적 지지)\n• 61.8% — 깊은 조정 (황금 비율)',
      actionRequired:         'free',
    },

    /* STEP 2  실제 사례 관찰 */
    {
      id:               'fib-adv-observe',
      targetSelector:   '#chart-area',
      position:         'right',
      focusBarsFromEnd: focusBars,
      title:            '실제 구간을 확인해봐요',
      body:             `MSFT는 이 구간에서 ${f(lowPrice)}에서 ${f(highPrice)}까지 약 +${rallyPct}% 강하게 상승했어요.\n\n이후 가격은 조정을 받으며 내려왔어요. 현재 가격(${fl(currentPrice)})이 고점 대비 약 ${retPct}% 되돌림 구간에 있어요.\n\n차트를 보며 확인해봐요:\n• 상승이 시작된 저점(왼쪽 아래)은 어디인가요?\n• 상승이 멈춘 고점(오른쪽 위)은 어디인가요?\n• 현재 가격은 고점과 저점 사이 어디쯤 있나요?\n\n이 세 지점이 다음 단계의 핵심이에요.`,
      actionRequired:   'free',
    },

    /* STEP 3  피보나치 작도 */
    {
      id:                         'fib-adv-draw',
      targetSelector:             '#chart-area',
      position:                   'bottom',
      focusBarsFromEnd:           focusBars,
      clearDrawingsOnEnter:       true,
      activateDrawingToolOnEnter: 'fibonacci',
      fibGuide: {
        lowDate,
        lowPrice,
        highDate,
        highPrice,
      },
      title:          '피보나치를 직접 그어봐요',
      body:           '차트를 보면 초록색 ① 저점과 주황색 ② 고점 마커가 표시돼 있어요.\n\n피보나치 그리기 모드가 자동으로 활성화됐어요.\n화면 상단 안내를 따라 두 번만 클릭해봐요:\n① 저점 클릭  ② 고점 클릭\n\n두 번 클릭하면 피보나치 레벨이 자동으로 그려져요.',
      tips: [
        '화면 상단에 "① 상승 시작 저점을 클릭하세요" 안내가 떠 있어요',
        '저점 클릭 후 "② 이제 고점을 클릭해서 완성하세요"로 바뀌어요',
        '두 점을 찍으면 38.2% · 50% · 61.8% 레벨이 표시돼요',
      ],
      mission:        '① 저점 ② 고점 순서로 클릭해봐요 (안 그려도 다음으로 넘어갈 수 있어요)',
      actionRequired: 'free',
    },

    /* STEP 4  레벨 해설 */
    {
      id:               'fib-adv-explain',
      targetSelector:   '#chart-area',
      position:         'bottom',
      focusBarsFromEnd: focusBars,
      title:            '각 레벨의 의미를 확인해봐요',
      body:             `이 구간(저점 ${f(lowPrice)} 고점 ${f(highPrice)})에 피보나치를 적용하면:\n\n• 23.6%  ${f(fib236)} — 가격이 잠깐 머문 구간\n• 38.2%  ${f(fib382)} — 강한 조정 후 반등 구간\n• 50.0%  ${f(fib50)} — 심리적 중간 지점\n• 61.8%  ${f(fib618)} — 황금 비율, 깊은 조정 구간\n\n현재 가격(${fl(currentPrice)})은 ${correctFib.label} 레벨(${f(correctFibPrice)}) 부근에 있어요.\n이 레벨에서 가격이 어떻게 반응하는지 주목해봐요.`,
      tips: [
        '레벨 근처에서 캔들이 여러 개 뭉치면 강한 지지예요',
        '강한 상승 추세에서는 38.2%에서 먼저 반등하는 경우가 많아요',
        '61.8%까지 내려가면 추세가 약해지는 신호일 수 있어요',
      ],
      actionRequired:   'free',
    },

    /* STEP 5  퀴즈 */
    {
      id:               'fib-adv-levels',
      targetSelector:   '#chart-area',
      position:         'bottom',
      focusBarsFromEnd: focusBars,
      title:            '현재 가격은 어느 피보나치 레벨 부근에 있을까요?',
      body:             `앞에서 그린 피보나치 레벨을 차트와 함께 확인해봐요.\n\n현재 가격(${fl(currentPrice)})은 고점 ${f(highPrice)}에서 조정 후 어느 레벨 부근에 있을까요?\n\n힌트: 고점(${f(highPrice)}) - 저점(${f(lowPrice)}) = 범위 ${f(range)}`,
      actionRequired:   'judgment',
      judgment: {
        question:     '현재 가격이 위치한 피보나치 레벨은?',
        correctValue: fibKey,
        hints: [
          `고점 ${f(highPrice)} - 저점 ${f(lowPrice)} = 범위 ${f(range)}`,
          `${correctFib.label} 레벨은 ${f(highPrice)} - ${f(range)} x ${correctFib.ratio} = ${f(correctFibPrice)} 부근`,
          `현재 가격 ${fl(currentPrice)}은 이 레벨과 가장 가깝게 일치해요`,
        ],
        choices: [
          {
            value:    '236',
            label:    `23.6% (${f(fib236)})`,
            feedback: wrongMsg('236', fib236),
          },
          {
            value:    '382',
            label:    `38.2% (${f(fib382)})`,
            feedback: wrongMsg('382', fib382),
          },
          {
            value:    '50',
            label:    `50% (${f(fib50)})`,
            feedback: wrongMsg('50', fib50),
          },
          {
            value:    '618',
            label:    `61.8% (${f(fib618)})`,
            feedback: wrongMsg('618', fib618),
          },
        ],
      },
      completionMessage: correctMsg[fibKey],
    },

    /* STEP 6  완료 */
    {
      id:               'fib-adv-complete',
      targetSelector:   '#chart-area',
      position:         'bottom',
      focusBarsFromEnd: focusBars,
      title:            '피보나치 심화 완료',
      body:             `실제 MSFT 차트에서 피보나치를 직접 그리고, ${correctFib.label} 레벨을 눈으로 확인했어요.\n\n핵심 정리:\n• 강한 추세 → 38.2%에서 먼저 반등\n• 중간 추세 → 50%에서 지지\n• 약한 추세 → 61.8%까지 하락 후 반등\n• 더 깊이 내려갈수록 → 추세 전환 경고\n\n실전 챌린지에서 피보나치를 활용해봐요!`,
      tips: [
        '38.2%에서 반등 → 상승 추세 지속 가능성 높음',
        '61.8% 이상 하락 → 추세 약화 신호',
        'MA 방향 + 피보나치 레벨이 겹치면 강력한 지지',
      ],
      actionRequired:   'free',
    },
  ]
}

/* ── 알려진 스윙 기반 Fallback ────────────────────────── */
/**
 * findFibSwing 이 null 을 반환할 때 사용하는 fallback 빌더.
 * 2026-03-30 저점 $356.28 → 2026-06-01 고점 $466.32 스윙을 사용하되,
 * 현재 가격 기반으로 정답을 동적으로 계산한다.
 */
function buildKnownSwingSteps(currentPrice: number): TutorialStep[] {
  const swing: FibSwing = (() => {
    const lowPrice  = 356.28
    const highPrice = 466.32
    const range     = highPrice - lowPrice
    const retracement = (highPrice - currentPrice) / range

    let closest = FIB_RATIOS[0], closestDiff = Infinity
    for (const f of FIB_RATIOS) {
      const d = Math.abs(retracement - f.ratio)
      if (d < closestDiff) { closestDiff = d; closest = f }
    }

    return {
      lowDate:      '2026-03-30',
      lowPrice,
      highDate:     '2026-06-01',
      highPrice,
      currentPrice,
      fibKey:       closest.key,
      focusBars:    55,
    }
  })()

  return buildStepsFromSwing(swing)
}

/* ── 하위 호환성을 위한 정적 export ─────────────────── */
/**
 * 이 배열은 tutorialStore 의 LESSON_MAP 에서 사용하지 않는다.
 * buildFibonacciSteps 를 거치지 않고 직접 참조하는 레거시 코드에
 * 대비해 유지한다.
 */
export const fibonacciSteps: TutorialStep[] = buildKnownSwingSteps(411)
