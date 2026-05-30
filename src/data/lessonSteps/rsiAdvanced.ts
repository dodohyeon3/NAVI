import type { TutorialStep } from '@/types'

/**
 * RSI 심화 레슨 — 5단계
 * 목표: 과매수/과매도 구간 직접 찾기 + 맥락 해석 능력 습득
 */
export const rsiAdvancedSteps: TutorialStep[] = [

  // ── STEP 1  RSI 활성화 ─────────────────────────────────
  {
    id:                      'rsi-adv-activate',
    targetSelector:          '#btn-rsi',
    position:                'top',
    clearIndicatorsOnEnter:  ['moving-average', 'bollinger', 'macd'],
    title:                   'RSI 심화 — 과매수·과매도를 읽어봐요',
    body:                    '기초에서 배운 RSI 70/30 룰을 실제 차트에 적용해봐요.\n\n이번엔 숫자를 외우는 게 아니라 — RSI가 이 구간에서 실제로 어떻게 행동하는지 직접 봐요.',
    mission:                 'RSI 버튼을 켜봐요',
    actionRequired:          'indicator-toggle',
    indicatorKey:            'rsi',
    completionMessage:       '보라색 RSI 선이 나타났어요. 70선과 30선 사이에서 어떻게 움직이는지 확인해봐요.',
  },

  // ── STEP 2  과매수 구간 분석 ─────────────────────────────
  {
    id:               'rsi-adv-overbought',
    targetSelector:   '#rsi-chart',
    position:         'top',
    focusBarsFromEnd: 120,
    title:            'RSI 70 이상 — 과매수',
    body:             'RSI 보라색 선이 빨간 기준선(70)을 넘은 구간을 찾아봐요.\n\n이 구간에서 가격은 어떻게 움직였나요?',
    actionRequired:   'judgment',
    judgment: {
      question: 'RSI 70+ 구간 이후 가격은?',
      choices: [
        {
          value:    'dropped',
          icon:     '↓',
          label:    '조정이 왔다',
          feedback: '맞아요! 과매수 이후 조정이 오는 경우가 많아요. 하지만 강한 상승장에서는 RSI 70+ 상태가 오래 지속되기도 해요.',
        },
        {
          value:    'continued',
          icon:     '↑',
          label:    '계속 올랐다',
          feedback: '강세장에서는 RSI가 70+ 상태를 오래 유지하며 계속 상승하기도 해요. RSI만으로 매도 결정을 내리면 위험해요.',
        },
        {
          value:    'flat',
          icon:     '→',
          label:    '횡보했다',
          feedback: '횡보 구간도 있어요. RSI가 내려와도 가격이 바로 하락하지 않는 경우예요.',
        },
      ],
    },
  },

  // ── STEP 3  과매도 구간 분석 ─────────────────────────────
  {
    id:               'rsi-adv-oversold',
    targetSelector:   '#rsi-chart',
    position:         'top',
    focusBarsFromEnd: 240,
    title:            'RSI 30 이하 — 과매도',
    body:             '이번엔 반대로 RSI가 초록 기준선(30) 아래로 내려간 구간을 찾아봐요.\n\n이 구간에서 반등이 일어났나요?',
    actionRequired:   'judgment',
    judgment: {
      question: 'RSI 30- 구간 이후 가격은?',
      choices: [
        {
          value:    'bounced',
          icon:     '↑',
          label:    '반등했다',
          feedback: '과매도 이후 반등은 흔해요! 하지만 반등 시점과 규모는 예측이 어려워요. MA 방향과 함께 봐야 확신할 수 있어요.',
        },
        {
          value:    'kept-falling',
          icon:     '↓',
          label:    '더 하락했다',
          feedback: '맞아요. 하락 추세에서는 RSI 30 이하에서도 계속 하락해요. 이때 MA 선들이 하향 배열이면 반등 신호로 보면 안 돼요.',
        },
        {
          value:    'sideways',
          icon:     '→',
          label:    '횡보했다',
          feedback: '과매도 이후 바닥을 다지며 횡보하는 경우도 있어요. RSI 단독보다 거래량·MA와 함께 보면 더 정확해요.',
        },
      ],
    },
  },

  // ── STEP 4  RSI + MA 결합 해석 ───────────────────────────
  {
    id:                     'rsi-adv-combine',
    targetSelector:         '#btn-moving-average',
    position:               'top',
    activateIndicatorsOnEnter: ['moving-average'],
    title:                  'RSI + MA 함께 보기',
    body:                   'MA를 함께 켜봐요. RSI와 MA가 같은 방향을 가리킬 때 신뢰도가 올라가요.\n\n• RSI 70+ & MA 상승 배열 → 강한 상승\n• RSI 30- & MA 하락 배열 → 강한 하락\n• RSI 30- & MA 상승 배열 → 반등 유력',
    actionRequired:         'free',
    completionMessage:       'MA 선들이 활성화됐어요. RSI와 MA 방향을 함께 비교해봐요.',
  },

  // ── STEP 5  심화 완료 ────────────────────────────────────
  {
    id:             'rsi-adv-complete',
    targetSelector: '#rsi-chart',
    position:       'top',
    focusBarsFromEnd: 30,
    title:          'RSI 심화 완료',
    body:           '과매수·과매도 구간을 직접 찾고 해석해봤어요.\n\n핵심:\n• RSI 70/30은 기준선일 뿐 — 추세와 함께 봐야 해요\n• MA 방향이 RSI 신호를 확인해줘요\n• 여러 지표가 같은 방향 = 더 높은 신뢰도\n\n실전 챌린지에서 이 개념을 적용해봐요!',
    tips: [
      'RSI 70+ & MA 하향 = 강한 매도 신호',
      'RSI 30- & MA 상향 = 강한 매수 신호',
      '신호가 쌓일수록 예측 확신이 높아져요',
    ],
    actionRequired: 'free',
  },
]
