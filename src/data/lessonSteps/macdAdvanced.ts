import type { TutorialStep } from '@/types'

/**
 * MACD 심화 레슨 — 5단계
 * 목표: 교차 신호(골든크로스·데드크로스) 직접 찾기 + 히스토그램 해석
 */
export const macdAdvancedSteps: TutorialStep[] = [

  // ── STEP 1  MACD 활성화 ────────────────────────────────
  {
    id:                     'macd-adv-activate',
    targetSelector:         '#btn-macd',
    position:               'top',
    clearIndicatorsOnEnter: ['moving-average', 'bollinger', 'rsi'],
    title:                  'MACD 심화 — 교차 신호를 찾아봐요',
    body:                   '기초에서 파란선(MACD)과 주황선(시그널)의 교차를 배웠어요.\n\n이번엔 실제 차트에서 교차가 발생한 위치를 직접 찾고, 히스토그램을 해석해봐요.',
    mission:                'MACD 버튼을 켜봐요',
    actionRequired:         'indicator-toggle',
    indicatorKey:           'macd',
    completionMessage:      'MACD 차트가 나타났어요. 파란선, 주황선, 히스토그램 3가지를 확인해봐요.',
  },

  // ── STEP 2  골든크로스 찾기 ─────────────────────────────
  {
    id:               'macd-adv-golden',
    targetSelector:   '#macd-chart',
    position:         'top',
    focusBarsFromEnd: 120,
    title:            '골든크로스 — 매수 신호',
    body:             'MACD 차트에서 파란선(MACD)이 주황선(시그널)을 아래에서 위로 교차하는 구간을 찾아봐요.\n\n이 순간 히스토그램이 어떻게 변하나요?',
    actionRequired:   'judgment',
    judgment: {
      question: '골든크로스 발생 시 히스토그램은?',
      choices: [
        {
          value:    'positive',
          icon:     '↑',
          label:    '0선 위로 올라온다',
          feedback: '맞아요! 파란선이 주황선 위로 교차하면 히스토그램도 0선 위로 올라와요. 상승 모멘텀이 시작됐다는 신호예요.',
        },
        {
          value:    'shrinks',
          icon:     '→',
          label:    '줄어들다가 뒤집힌다',
          feedback: '정확해요! 교차 직전 히스토그램이 점점 줄어들다가 0을 넘어 양수가 돼요. 이 줄어드는 구간이 교차 예고예요.',
        },
        {
          value:    'stays',
          icon:     '↓',
          label:    '변화 없다',
          feedback: '히스토그램은 MACD - 시그널 값이에요. 교차가 일어나면 반드시 0을 넘어요.',
        },
      ],
    },
  },

  // ── STEP 3  데드크로스 찾기 ────────────────────────────
  {
    id:               'macd-adv-dead',
    targetSelector:   '#macd-chart',
    position:         'top',
    focusBarsFromEnd: 200,
    title:            '데드크로스 — 매도 신호',
    body:             '반대로 파란선이 주황선을 위에서 아래로 교차하는 구간을 찾아봐요.\n\n교차 이후 가격은 어떻게 됐나요?',
    actionRequired:   'judgment',
    judgment: {
      question: '데드크로스 이후 가격은?',
      choices: [
        {
          value:    'dropped',
          icon:     '↓',
          label:    '하락했다',
          feedback: '맞아요! 데드크로스는 하락 모멘텀 신호예요. 특히 0선 아래에서 교차가 일어나면 더 강한 신호예요.',
        },
        {
          value:    'rose',
          icon:     '↑',
          label:    '오히려 올랐다',
          feedback: '이런 경우도 있어요. 특히 0선 위 고점 근처에서의 교차는 위력이 약하거나 페이크 신호일 수 있어요. MACD 단독으로 보면 위험해요.',
        },
        {
          value:    'flat',
          icon:     '→',
          label:    '횡보했다',
          feedback: '횡보도 있어요. 데드크로스 직후 바로 하락하지 않고 박스권을 유지하다가 나중에 하락하기도 해요.',
        },
      ],
    },
  },

  // ── STEP 4  히스토그램 해석 ─────────────────────────────
  {
    id:               'macd-adv-histogram',
    targetSelector:   '#macd-chart',
    position:         'top',
    focusBarsFromEnd: 60,
    title:            '히스토그램 — 모멘텀의 강도',
    body:             '막대의 높이는 모멘텀의 강도예요.\n\n막대가 점점 길어지면 → 추세가 강해지는 중\n막대가 점점 짧아지면 → 추세가 약해지는 중 (교차 예고)',
    actionRequired:   'judgment',
    judgment: {
      question: '현재 히스토그램의 변화는?',
      choices: [
        {
          value:    'growing',
          icon:     '↑',
          label:    '막대가 커지고 있다',
          feedback: '모멘텀이 강해지는 중이에요. 현재 추세가 지속될 가능성이 높아요.',
        },
        {
          value:    'shrinking',
          icon:     '↓',
          label:    '막대가 작아지고 있다',
          feedback: '모멘텀이 약해지는 중이에요. 추세 전환이 가까워지고 있을 수 있어요.',
        },
        {
          value:    'crossing',
          icon:     '→',
          label:    '0선 근처에 있다',
          feedback: '교차 직전 상태예요! 이 구간에서는 MA 방향을 확인해서 추세를 판단해봐요.',
        },
      ],
    },
  },

  // ── STEP 5  심화 완료 ────────────────────────────────────
  {
    id:             'macd-adv-complete',
    targetSelector: '#macd-chart',
    position:       'top',
    focusBarsFromEnd: 30,
    title:          'MACD 심화 완료',
    body:           '골든크로스, 데드크로스, 히스토그램을 직접 찾아봤어요.\n\n핵심:\n• 교차 전 히스토그램이 줄어드는 것이 예고 신호\n• 0선 위 교차 = 강한 신호 / 0선 아래 교차 = 약한 신호\n• RSI, MA와 함께 볼 때 더 강력해요\n\n실전 챌린지에서 MACD를 활용해봐요!',
    tips: [
      '히스토그램이 점점 줄어들면 교차가 임박했어요',
      '0선 위 골든크로스 = 강세 확인',
      '0선 아래 골든크로스 = 반등 시작 가능성',
    ],
    actionRequired: 'free',
  },
]
