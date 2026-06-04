import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '주식 차트 분석 | NAVIchart',
  description:
    'NVDA 실제 데이터로 RSI, MACD, 볼린저밴드, 캔들패턴을 직접 분석해보세요.',
  alternates: {
    canonical: '/chart',
  },
}

export default function ChartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
