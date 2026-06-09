import type { TutorialStep, CandleData } from '@/types'

/**
 * 피보나치 심화 레슨 — 동적 빌더
 *
 * buildFibonacciSteps(data) 를 호출하면 현재 차트 데이터에서
 * "완성된 스윙 패턴"(저점→고점→되돌림→반등 확인)을 자동 탐지하여
 * 각 단계 설명과 퀴즈 정답을 동적으로 생성한다.
 *
 * 패턴 탐지 조건:
 *   1. 저점→고점 상승폭 15% 이상
 *   2. 고점 이후 피보나치 레벨(23.6 / 38.2 / 50 / 61.8)에서 되돌림
 *   3. 되돌림 저점 이후 2.5% 이상 반등 확인 (완성된 패턴)
 *
 * 패턴을 찾지 못하면 정적 fallback(fibonacciSteps)으로 대체한다.
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
  lowDate:     string
  lowPrice:    number
  highDate:    string
  highPrice:   number
  bounceDate:  string
  bouncePrice: number
  fibKey:      FibKey
  focusBars:   number
}

/* ── 스윙 탐지 ─────────────────────────────────────────── */
function findFibSwing(data: CandleData[]): FibSwing | null {
  const N = data.length
  if (N < 80) return null

  let best: (FibSwing & { score: number }) | null = null

  // 고점 후 반등 확인에 최소 15봉 필요 → 고점 탐색 상한
  const hiEnd = N - 15

  for (let hiIdx = 30; hiIdx < hiEnd; hiIdx++) {
    if (data[hiIdx].time < '2000-01-01') continue

    const hiPrice = data[hiIdx].high

    // 로컬 최고점 확인 (±10봉 내 최대)
    let isHigh = true
    for (let j = Math.max(0, hiIdx - 10); j <= Math.min(N - 1, hiIdx + 10); j++) {
      if (j !== hiIdx && data[j].high >= hiPrice * 1.002) { isHigh = false; break }
    }
    if (!isHigh) continue

    // 고점 이전 30~100봉 구간에서 스윙 저점 탐색
    let loIdx = -1, loPrice = Infinity
    for (let j = Math.max(0, hiIdx - 100); j < Math.max(0, hiIdx - 20); j++) {
      if (data[j].low < loPrice) { loPrice = data[j].low; loIdx = j }
    }
    if (loIdx < 0) continue

    const rally = (hiPrice - loPrice) / loPrice
    if (rally < 0.15) continue   // 최소 15% 상승 필요

    const range = hiPrice - loPrice

    // 고점 이후 5~70봉 내 되돌림 저점 탐색
    let pbIdx = -1, pbPrice = Infinity
    const pbEnd = Math.min(hiEnd, hiIdx + 70)
    for (let j = hiIdx + 3; j < pbEnd; j++) {
      if (data[j].low < pbPrice) { pbPrice = data[j].low; pbIdx = j }
    }
    if (pbIdx < 0) continue

    const retracement = (hiPrice - pbPrice) / range
    if (retracement < 0.18 || retracement > 0.80) continue

    // 가장 가까운 피보나치 레벨 선택
    let closest = FIB_RATIOS[0]
    let closestDiff = Math.abs(retracement - FIB_RATIOS[0].ratio)
    for (const f of FIB_RATIOS) {
      const d = Math.abs(retracement - f.ratio)
      if (d < closestDiff) { closestDiff = d; closest = f }
    }
    if (closestDiff > 0.08) continue   // 어느 레벨과도 너무 멀면 제외

    // 반등 확인: 되돌림 저점 이후 최소 2.5% 회복
    const recovEnd = Math.min(N - 1, pbIdx + 20)
    if (recovEnd <= pbIdx + 2) continue
    let maxRecov = 0
    for (let j = pbIdx + 2; j <= recovEnd; j++) {
      if (data[j].close > maxRecov) maxRecov = data[j].close
    }
    const recovery = (maxRecov - pbPrice) / pbPrice
    if (recovery < 0.025) continue   // 반등 미확인 → 패턴 불완전

    // 점수: 상승폭 × 레벨 정확도 × 반등 강도
    const score = rally * (1 - closestDiff * 4) * (1 + recovery * 2)

    if (!best || score > best.score) {
      best = {
        lowDate:     data[loIdx].time,
        lowPrice:    loPrice,
        highDate:    data[hiIdx].time,
        highPrice:   hiPrice,
        bounceDate:  data[pbIdx].time,
        bouncePrice: pbPrice,
        fibKey:      closest.key,
        focusBars:   Math.min(N - loIdx + 8, 75),
        score,
      }
    }
  }

  return best
}

/* ── 동적 단계 생성 ────────────────────────────────────── */
export function buildFibonacciSteps(data: CandleData[]): TutorialStep[] {
  const swing = findFibSwing(data)
  if (!swing) return fibonacciSteps   // 패턴 미발견 시 정적 fallback

  const { lowDate, lowPrice, highDate, highPrice,
          bouncePrice, fibKey, focusBars } = swing

  const range    = highPrice - lowPrice
  const rallyPct = Math.round(range / lowPrice * 100)

  const fib236 = highPrice - range * 0.236
  const fib382 = highPrice - range * 0.382
  const fib50  = highPrice - range * 0.500
  const fib618 = highPrice - range * 0.618

  const f  = (p: number) => '$' + p.toFixed(0)
  const fl = (p: number) => '$' + p.toFixed(2)

  const correctFibPrice =
    fibKey === '236' ? fib236 :
    fibKey === '382' ? fib382 :
    fibKey ===  '50' ? fib50  : fib618

  const correctFib = FIB_RATIOS.find(r => r.key === fibKey)!

  const correctMsg: Record<FibKey, string> = {
    '236': `맞아요! 23.6% 레벨(${f(fib236)}) 부근에서 반등이 시작됐어요. 추세가 극도로 강할 때 나타나는 얕은 조정이에요.`,
    '382': `맞아요! 38.2% 레벨(${f(fib382)}) 부근에서 반등이 시작됐어요. 강한 추세에서 가장 자주 나타나는 되돌림 레벨이에요.`,
     '50': `맞아요! 50% 레벨(${f(fib50)}) 부근에서 반등이 시작됐어요. 심리적 중간 지점에서 매수세가 유입된 경우예요.`,
    '618': `맞아요! 61.8% 레벨(${f(fib618)}) 부근에서 반등이 시작됐어요. 황금 비율 레벨에서 강한 지지를 받은 사례예요.`,
  }

  const wrongMsg = (key: FibKey, price: number) =>
    fibKey === key
      ? correctMsg[key]
      : `실제 반등점(${f(bouncePrice)})은 ${f(price)} 레벨과 거리가 있어요. ${correctFib.label}(${f(correctFibPrice)}) 레벨을 다시 확인해봐요.`

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
      title:            '실제 반등 사례를 확인해봐요',
      body:             `MSFT는 이 구간에서 ${f(lowPrice)}에서 ${f(highPrice)}까지 약 +${rallyPct}% 강하게 상승했어요.\n\n이후 조정이 와서 잠시 하락했다가 다시 반등했어요.\n\n차트를 보며 확인해봐요:\n• 상승이 시작된 저점(왼쪽 아래)은 어디인가요?\n• 상승이 멈춘 고점(오른쪽 위)은 어디인가요?\n• 고점 이후 가격이 어디서 멈추고 반등했나요?\n\n이 세 지점이 다음 단계의 핵심이에요.`,
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
      title:            '각 레벨의 의미와 실제 반응을 확인해봐요',
      body:             `이 구간(저점 ${f(lowPrice)} 고점 ${f(highPrice)})에 피보나치를 적용하면:\n\n• 23.6%  ${f(fib236)} — 가격이 잠깐 머문 구간\n• 38.2%  ${f(fib382)} — 강한 조정 후 반등 구간\n• 50.0%  ${f(fib50)} — 심리적 중간 지점\n• 61.8%  ${f(fib618)} — 황금 비율, 깊은 조정 구간\n\n실제로 가격이 ${f(correctFibPrice)} 부근에서 멈추고 다시 상승했어요.\n어느 레벨에서 반등이 시작됐는지 차트를 보며 확인해봐요.`,
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
      title:            '이 차트에서 가격은 어느 레벨에서 반등했을까요?',
      body:             `앞에서 확인한 차트를 떠올려봐요.\n\n고점 ${f(highPrice)}에서 조정 후 가격이 멈추고 반등한 피보나치 레벨은 어디일까요?\n\n힌트: 반등이 시작된 저점은 ${fl(bouncePrice)} 부근이에요.`,
      actionRequired:   'judgment',
      judgment: {
        question:     '이 구간에서 가격이 반등한 피보나치 레벨은?',
        correctValue: fibKey,
        hints: [
          `고점 ${f(highPrice)} - 저점 ${f(lowPrice)} = 범위 ${f(range)}`,
          `${correctFib.label} 레벨은 ${f(highPrice)} - ${f(range)} x ${correctFib.ratio} = ${f(correctFibPrice)} 부근`,
          `실제 저점 ${fl(bouncePrice)}은 이 레벨과 가장 가깝게 일치해요`,
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
      body:             `실제 MSFT 차트에서 피보나치를 직접 그리고, ${correctFib.label} 반등을 눈으로 확인했어요.\n\n핵심 정리:\n• 강한 추세 → 38.2%에서 먼저 반등\n• 중간 추세 → 50%에서 지지\n• 약한 추세 → 61.8%까지 하락 후 반등\n• 더 깊이 내려갈수록 → 추세 전환 경고\n\n실전 챌린지에서 피보나치를 활용해봐요!`,
      tips: [
        '38.2%에서 반등 → 상승 추세 지속 가능성 높음',
        '61.8% 이상 하락 → 추세 약화 신호',
        'MA 방향 + 피보나치 레벨이 겹치면 강력한 지지',
      ],
      actionRequired:   'free',
    },
  ]
}

/* ── 정적 Fallback ────────────────────────────────────── */
/**
 * 데이터 없이 startLesson 할 때 또는 패턴 미발견 시 사용하는 정적 단계.
 * 교육용 구간: 2026-03-30 저점 $356.28 → 2026-06-01 고점 $466.32
 * (buildFibonacciSteps 가 패턴을 찾으면 이 배열은 사용되지 않는다)
 */
export const fibonacciSteps: TutorialStep[] = [

  {
    id:                     'fib-adv-intro',
    targetSelector:         '#drawing-tools-card',
    mobileTargetSelector:   '#drawing-toolbar',
    position:               'left',
    clearIndicatorsOnEnter: ['rsi', 'macd', 'bollinger', 'moving-average'],
    clearDrawingsOnEnter:   true,
    focusBarsFromEnd:       55,
    title:                  '피보나치 심화 — 조정 구간을 예측해봐요',
    body:                   '가격이 강하게 오른 뒤 얼마나 내려갈까요?\n\n피보나치 되돌림은 이 조정 폭을 예측하는 도구예요. 저점에서 고점을 두 번 클릭하면 주요 레벨이 자동으로 그려져요.\n\n주요 레벨:\n• 38.2% — 얕은 조정 (강한 상승 추세)\n• 50% — 중간 조정 (심리적 지지)\n• 61.8% — 깊은 조정 (황금 비율)',
    actionRequired:         'free',
  },

  {
    id:               'fib-adv-observe',
    targetSelector:   '#chart-area',
    position:         'right',
    focusBarsFromEnd: 55,
    title:            '실제 반등 사례를 확인해봐요',
    body:             'MSFT는 이 구간에서 $356에서 $466까지 약 +31% 강하게 상승했어요.\n\n이후 조정이 와서 잠시 하락했다가 다시 반등했어요.\n\n차트를 보며 확인해봐요:\n• 상승이 시작된 저점(왼쪽 아래)은 어디인가요?\n• 상승이 멈춘 고점(오른쪽 위)은 어디인가요?\n• 고점 이후 가격이 어디서 멈추고 반등했나요?\n\n이 세 지점이 다음 단계의 핵심이에요.',
    actionRequired:   'free',
  },

  {
    id:                         'fib-adv-draw',
    targetSelector:             '#chart-area',
    position:                   'bottom',
    focusBarsFromEnd:           55,
    clearDrawingsOnEnter:       true,
    activateDrawingToolOnEnter: 'fibonacci',
    fibGuide: {
      lowDate:   '2026-03-30',
      lowPrice:  356.28,
      highDate:  '2026-06-01',
      highPrice: 466.32,
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

  {
    id:               'fib-adv-explain',
    targetSelector:   '#chart-area',
    position:         'bottom',
    focusBarsFromEnd: 55,
    title:            '각 레벨의 의미와 실제 반응을 확인해봐요',
    body:             '이 구간(저점 $356 고점 $466)에 피보나치를 적용하면:\n\n• 23.6%  $440 — 가격이 잠깐 머문 구간\n• 38.2%  $424 — 강한 조정 후 반등 구간\n• 50.0%  $411 — 심리적 중간 지점\n• 61.8%  $398 — 황금 비율, 깊은 조정 구간\n\n실제로 가격이 $424 부근에서 멈추고 다시 상승했어요.\n어느 레벨에서 반등이 시작됐는지 차트를 보며 확인해봐요.',
    tips: [
      '레벨 근처에서 캔들이 여러 개 뭉치면 강한 지지예요',
      '강한 상승 추세에서는 38.2%에서 먼저 반등하는 경우가 많아요',
      '61.8%까지 내려가면 추세가 약해지는 신호일 수 있어요',
    ],
    actionRequired:   'free',
  },

  {
    id:               'fib-adv-levels',
    targetSelector:   '#chart-area',
    position:         'bottom',
    focusBarsFromEnd: 55,
    title:            '이 차트에서 가격은 어느 레벨에서 반등했을까요?',
    body:             '앞에서 확인한 차트를 떠올려봐요.\n\n고점 $466에서 조정 후 가격이 멈추고 반등한 피보나치 레벨은 어디일까요?\n\n힌트: 반등이 시작된 저점은 $424 부근이에요.',
    actionRequired:   'judgment',
    judgment: {
      question:     '이 구간에서 가격이 반등한 피보나치 레벨은?',
      correctValue: '382',
      hints: [
        '고점 $466 - 저점 $356 = 범위 $110',
        '38.2% 레벨은 $466 - $110 x 0.382 = $424 부근',
        '실제 저점 $424.25는 이 레벨과 가장 가깝게 일치해요',
      ],
      choices: [
        {
          value:    '236',
          label:    '23.6% ($440)',
          feedback: '23.6%는 $440 부근이에요. 가격이 $440까지만 내려오고 반등했다면 추세가 극도로 강한 거예요. 이 구간에서는 더 깊게 조정이 왔어요.',
        },
        {
          value:    '382',
          label:    '38.2% ($424)',
          feedback: '맞아요! +31% 상승 후 38.2% 레벨($424) 부근에서 반등이 시작됐어요. 강한 추세에서 가장 자주 나타나는 되돌림 레벨이에요.',
        },
        {
          value:    '50',
          label:    '50% ($411)',
          feedback: '50% 레벨은 $411 부근이에요. 실제 저점 $424보다 아래에 있어요. 반등은 그 전에 이미 시작됐어요.',
        },
        {
          value:    '618',
          label:    '61.8% ($398)',
          feedback: '61.8%는 $398 부근이에요. 이 구간까지 하락하지 않고 38.2%에서 반등했어요.',
        },
      ],
    },
    completionMessage: '38.2% 반등을 확인했어요! 추세가 강할수록 얕은 레벨(38.2%)에서 매수세가 유입돼요.',
  },

  {
    id:               'fib-adv-complete',
    targetSelector:   '#chart-area',
    position:         'bottom',
    focusBarsFromEnd: 55,
    title:            '피보나치 심화 완료',
    body:             '실제 MSFT 차트에서 피보나치를 직접 그리고, 38.2% 반등을 눈으로 확인했어요.\n\n핵심 정리:\n• 강한 추세 → 38.2%에서 먼저 반등\n• 중간 추세 → 50%에서 지지\n• 약한 추세 → 61.8%까지 하락 후 반등\n• 더 깊이 내려갈수록 → 추세 전환 경고\n\n실전 챌린지에서 피보나치를 활용해봐요!',
    tips: [
      '38.2%에서 반등 → 상승 추세 지속 가능성 높음',
      '61.8% 이상 하락 → 추세 약화 신호',
      'MA 방향 + 피보나치 레벨이 겹치면 강력한 지지',
    ],
    actionRequired:   'free',
  },
]
