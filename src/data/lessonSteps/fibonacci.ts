import type { TutorialStep } from '@/types'

/**
 * 피보나치 심화 레슨 — 5단계
 * 목표: 고점·저점 직접 선택 + 핵심 레벨 체득 + 지지/저항 판단
 */
export const fibonacciSteps: TutorialStep[] = [

  // ── STEP 1  피보나치 개념 소개 ───────────────────────────
  {
    id:                     'fib-adv-intro',
    targetSelector:         '#drawing-tools-card',
    position:               'left',
    clearIndicatorsOnEnter: ['rsi', 'macd', 'bollinger'],
    clearDrawingsOnEnter:   true,
    title:                  '피보나치 심화 — 되돌림 구간 찾기',
    body:                   '강한 상승(또는 하락) 후 가격은 얼마나 되돌아갈까요?\n\n피보나치 되돌림은 이 되돌림 구간을 예측하는 도구예요. 38.2%, 50%, 61.8%가 주요 지지·저항선으로 많이 쓰여요.',
    actionRequired:         'free',
  },

  // ── STEP 2  MA 켜고 추세 확인 ───────────────────────────
  {
    id:                        'fib-adv-trend',
    targetSelector:            '#btn-moving-average',
    position:                  'top',
    activateIndicatorsOnEnter: ['moving-average'],
    focusBarsFromEnd:          120,
    title:                     '먼저 추세를 확인해봐요',
    body:                      '피보나치를 그리기 전에 MA 선으로 추세를 먼저 확인해봐요.\n\n상승 추세에서는 저점→고점 순으로, 하락 추세에서는 고점→저점 순으로 클릭해요.',
    actionRequired:            'judgment',
    judgment: {
      question: '현재 이 구간의 추세는?',
      choices: [
        {
          value:    'up',
          icon:     '↑',
          label:    '상승 추세',
          feedback: '상승 추세에서는 저점(시작)과 고점(끝)을 클릭해요. 되돌림 구간이 지지선이 돼요.',
        },
        {
          value:    'down',
          icon:     '↓',
          label:    '하락 추세',
          feedback: '하락 추세에서는 고점(시작)과 저점(끝)을 클릭해요. 되돌림 구간이 저항선이 돼요.',
        },
        {
          value:    'sideways',
          icon:     '→',
          label:    '횡보',
          feedback: '횡보 구간에서는 피보나치 효과가 약해요. 직전 강한 추세 구간을 찾아 적용해봐요.',
        },
      ],
    },
  },

  // ── STEP 3  직접 피보나치 그리기 ────────────────────────
  {
    id:             'fib-adv-draw',
    targetSelector: '#drawing-tools-card',
    position:       'left',
    title:          '피보나치를 직접 그어봐요',
    body:           '작도 도구 → 피보나치 버튼을 클릭하고 차트에서 직접 그어봐요.\n\n상승 추세라면: 저점 클릭 → 고점 클릭\n하락 추세라면: 고점 클릭 → 저점 클릭',
    tips: [
      '피보나치 버튼 클릭 후 차트에서 두 점을 클릭해요',
      '강한 추세의 시작점과 끝점을 선택해요',
      '23.6% · 38.2% · 50% · 61.8% · 78.6% 레벨이 표시돼요',
    ],
    mission:        '피보나치를 한 번 직접 그어봐요 (안 그려도 다음으로 넘어갈 수 있어요)',
    actionRequired: 'free',
  },

  // ── STEP 4  핵심 레벨 판단 ─────────────────────────────
  {
    id:             'fib-adv-levels',
    targetSelector: '#chart-area',
    position:       'bottom',
    title:          '어느 레벨이 가장 강한 지지일까요?',
    body:           '일반적으로 61.8%가 가장 중요한 되돌림 구간이에요.\n\n38.2%, 50%, 61.8% 중 가격이 가장 자주 멈추는 구간을 직접 확인해봐요.',
    actionRequired: 'judgment',
    judgment: {
      question: '3개의 핵심 레벨 중 가장 강한 지지로 알려진 곳은?',
      choices: [
        {
          value:    '382',
          icon:     '→',
          label:    '38.2%',
          feedback: '38.2%는 약한 되돌림 이후 강한 상승 추세에서 나타나요. 추세가 강할수록 여기서 반등하고 다시 올라가요.',
        },
        {
          value:    '50',
          icon:     '→',
          label:    '50%',
          feedback: '50%는 피보나치 수학적 비율은 아니지만 심리적으로 중요한 구간이에요. 많은 트레이더가 이 지점을 주목해요.',
        },
        {
          value:    '618',
          icon:     '✓',
          label:    '61.8% (황금 비율)',
          feedback: '맞아요! 61.8%는 황금 비율로 불리며 피보나치에서 가장 강한 지지·저항 구간이에요. 이 레벨에서 반등하면 추세가 계속될 가능성이 높아요.',
        },
      ],
    },
    completionMessage: '61.8% 레벨을 기억해두세요. 실전 챌린지에서 피보나치를 그려 이 구간을 찾아봐요!',
  },

  // ── STEP 5  심화 완료 ────────────────────────────────────
  {
    id:             'fib-adv-complete',
    targetSelector: '#chart-area',
    position:       'bottom',
    title:          '피보나치 심화 완료',
    body:           '추세를 파악하고, 직접 피보나치를 그리고, 핵심 레벨을 확인했어요.\n\n핵심:\n• 추세 방향 확인 후 저점↔고점 선택\n• 61.8% = 황금 비율 (가장 강한 지지·저항)\n• 캔들이 이 레벨에서 멈추면 반전 신호\n\n실전 챌린지에서 피보나치를 활용해봐요!',
    tips: [
      '38.2% = 약한 조정 / 61.8% = 강한 조정',
      '61.8%에서 반등하면 추세 지속 가능성 높음',
      '볼린저 밴드와 함께 피보나치 레벨이 겹치면 강력한 신호',
    ],
    actionRequired: 'free',
  },
]
