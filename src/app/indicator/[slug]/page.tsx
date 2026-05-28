import { notFound } from 'next/navigation'
import Link from 'next/link'
import { indicators } from '@/data/indicators'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import { RoundedCard } from '@/components/ui/RoundedCard'
import { MiniChartPreview } from '@/components/chart/MiniChartPreview'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return Object.keys(indicators).map((slug) => ({ slug }))
}

export default function IndicatorDetailPage({ params }: Props) {
  const indicator = indicators[params.slug]
  if (!indicator) notFound()

  return (
    <main className="min-h-screen px-4 py-10 max-w-2xl mx-auto">
      {/* 뒤로가기 */}
      <Link href="/chart" className="text-navi-muted text-sm hover:text-navi-text">
        ← 차트로 돌아가기
      </Link>

      {/* 헤더 */}
      <div className="mt-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-navi-text">{indicator.name}</h1>
          <DifficultyBadge level={indicator.difficulty} />
        </div>
        <p className="text-navi-accent font-medium text-sm leading-relaxed">
          {indicator.oneLineSummary}
        </p>
      </div>

      <div className="space-y-4">

        {/* ── 실제 차트 예시 ── */}
        <RoundedCard>
          <p className="text-xs text-navi-muted font-semibold uppercase tracking-wide mb-3">
            실제 차트 예시 · NVDA 최근 데이터
          </p>
          <MiniChartPreview slug={indicator.slug} />
        </RoundedCard>

        {/* ── 한마디 요약 ── */}
        <RoundedCard>
          <p className="text-xs text-navi-muted font-semibold uppercase tracking-wide mb-2">
            이게 뭔가요?
          </p>
          <p className="text-navi-text text-sm leading-relaxed whitespace-pre-line">
            {indicator.description}
          </p>
        </RoundedCard>

        {/* ── 어떻게 읽나요 ── */}
        <RoundedCard>
          <p className="text-xs text-navi-muted font-semibold uppercase tracking-wide mb-3">
            어떻게 읽어요?
          </p>
          <ul className="space-y-3">
            {indicator.howToRead.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-navi-text leading-relaxed">
                <span className="text-navi-accent shrink-0 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </RoundedCard>

        {/* ── 실전 팁 ── */}
        {indicator.tips && indicator.tips.length > 0 && (
          <RoundedCard>
            <p className="text-xs text-navi-muted font-semibold uppercase tracking-wide mb-3">
              💡 실전 팁
            </p>
            <ul className="space-y-3">
              {indicator.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                  <span className="text-navi-text">{tip}</span>
                </li>
              ))}
            </ul>
          </RoundedCard>
        )}

        {/* ── 주의할 점 ── */}
        {indicator.caution && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">
              ⚠ 주의할 점
            </p>
            <p className="text-sm text-navi-text leading-relaxed">
              {indicator.caution}
            </p>
          </div>
        )}

      </div>

      {/* CTA */}
      <div className="mt-8">
        <Link
          href="/chart"
          className="w-full block text-center py-3.5 bg-navi-accent text-white
                     font-semibold rounded-2xl hover:bg-indigo-500 transition-colors"
        >
          차트에서 직접 확인해보기 →
        </Link>
      </div>
    </main>
  )
}
