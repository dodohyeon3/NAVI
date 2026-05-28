export type IndicatorSlug = 'rsi' | 'macd' | 'bollinger' | 'moving-average' | 'trendline' | 'fibonacci'

export interface Indicator {
  slug: IndicatorSlug
  name: string
  oneLineSummary: string
  description: string
  howToRead: string[]
  tips?: string[]        // 실전 활용 팁
  caution?: string       // 주의할 점
  difficulty: 1 | 2 | 3  // 1=쉬움, 3=어려움
  exampleImageUrl?: string
}

export interface TutorialStep {
  id: string
  targetSelector: string   // CSS selector for spotlight target
  title: string
  body: string
  tips?: string[]          // 불릿 포인트 형태의 추가 안내
  mission?: string         // 이 단계에서 직접 해볼 미션
  position: 'top' | 'bottom' | 'left' | 'right'
}

export interface CandleData {
  time: string   // 'YYYY-MM-DD'
  open: number
  high: number
  low: number
  close: number
}
