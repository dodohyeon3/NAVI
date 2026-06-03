import {
  fetchEventCounts,
  fetchDailyTrend,
  fetchTutorialStepCounts,
  fetchAdvancedStepCounts,
  fetchJudgmentAccuracy,
  fetchTestAccuracy,
  fetchIndicatorUsage,
  fetchDrawingUsage,
  fetchRecentEvents,
  fetchRetryDistribution,
  IS_POSTHOG_CONFIGURED,
} from '@/lib/posthog-admin'
import { KPICard }          from '@/components/manage/KPICard'
import { SectionCard, NotConfigured } from '@/components/manage/SectionCard'
import { HBarChart }        from '@/components/manage/HBarChart'
import { FunnelChart }      from '@/components/manage/FunnelChart'
import { StepDropoff }      from '@/components/manage/StepDropoff'
import { LineChart }        from '@/components/manage/LineChart'
import { EventLog }         from '@/components/manage/EventLog'

export const revalidate = 300  // 5분 캐시

/* ─── 안전 숫자 접근 헬퍼 ──────────────────────────────── */
type EventMap = Record<string, { today: number; d7: number; d30: number; users: number }>
function cnt(map: EventMap | null, key: string, period: 'today'|'d7'|'d30' = 'd30') {
  return map?.[key]?.[period] ?? 0
}
function pct(a: number, b: number) {
  return b > 0 ? Math.round((a / b) * 100) : 0
}

/* ─── 설정 안내 배너 ─────────────────────────────────── */
function ConfigBanner() {
  return (
    <div className="bg-navi-warning/[0.08] border border-navi-warning/25 rounded-2xl p-4 mb-6">
      <p className="text-[13px] font-bold text-navi-text mb-1">📊 PostHog API 미연결 상태</p>
      <p className="text-[12px] text-navi-secondary leading-relaxed mb-3">
        실제 데이터를 보려면 아래 환경변수를 Vercel에 추가하고 재배포하세요.
      </p>
      <div className="bg-navi-surface rounded-xl p-3 font-mono text-[11px] text-navi-text space-y-1">
        <p><span className="text-navi-action">POSTHOG_PERSONAL_API_KEY</span>=phx_...  <span className="text-navi-muted"># PostHog → Settings → Personal API Keys</span></p>
        <p><span className="text-navi-action">POSTHOG_PROJECT_ID</span>=12345          <span className="text-navi-muted"># PostHog URL의 숫자 프로젝트 ID</span></p>
        <p><span className="text-navi-action">ADMIN_PASSWORD</span>=your_password      <span className="text-navi-muted"># 이 페이지 로그인 비밀번호</span></p>
      </div>
    </div>
  )
}

export default async function ManagePage() {
  /* ── 모든 데이터 병렬 fetch ────────────────────────── */
  const [events, trend, steps, advSteps, judgment, testAcc, indicators, drawings, recentEvt, retry] =
    await Promise.all([
      fetchEventCounts(),
      fetchDailyTrend(),
      fetchTutorialStepCounts(),
      fetchAdvancedStepCounts(),
      fetchJudgmentAccuracy(),
      fetchTestAccuracy(),
      fetchIndicatorUsage(),
      fetchDrawingUsage(),
      fetchRecentEvents(100),
      fetchRetryDistribution(),
    ])

  /* ── KPI 계산 ─────────────────────────────────────── */
  const pageviews30   = cnt(events, '$pageview')
  const pageviewsToday = cnt(events, '$pageview', 'today')
  const tutStart30    = cnt(events, 'tutorial_started')
  const tutDone30     = cnt(events, 'tutorial_completed')
  const tutRate       = pct(tutDone30, tutStart30)
  const chalStart30   = cnt(events, 'challenge_started')
  const chalDone30    = cnt(events, 'challenge_completed')
  const chalRate      = pct(chalDone30, chalStart30)
  const advStart30    = cnt(events, 'advanced_rsi_started')
                      + cnt(events, 'advanced_macd_started')
                      + cnt(events, 'advanced_fibonacci_started')
  const advDone30     = cnt(events, 'advanced_rsi_completed')
                      + cnt(events, 'advanced_macd_completed')
                      + cnt(events, 'advanced_fibonacci_completed')
  const advRate       = pct(advDone30, advStart30)
  const retryCount30  = cnt(events, 'simulation_retry')

  /* ── 방문자 수 (unique pageview distinct_id 30일) ─── */
  const visitors30  = events?.['$pageview']?.users ?? 0
  const visitorsToday = cnt(events, '$pageview', 'today') > 0 ? '–' : 0  // today unique 는 별도 쿼리 필요

  /* ── 퍼널 데이터 ────────────────────────────────── */
  const funnelSteps = [
    { label: '홈 방문',          event: '$pageview',             count: cnt(events, '$pageview') },
    { label: '튜토리얼 시작',    event: 'tutorial_started',      count: tutStart30 },
    { label: '튜토리얼 완료',    event: 'tutorial_completed',    count: tutDone30 },
    { label: '추가학습 진입',    event: 'advanced_learning_opened', count: cnt(events, 'advanced_learning_opened') },
    { label: '추가학습 완료',    event: 'advanced_*_completed',  count: advDone30 },
    { label: '챌린지 시작',      event: 'challenge_started',     count: chalStart30 },
    { label: '챌린지 완료',      event: 'challenge_completed',   count: chalDone30 },
  ].map((s, i, arr) => ({ ...s, prev: arr[i - 1]?.count }))

  /* ── 심화 학습별 그룹핑 ──────────────────────────── */
  const TOPICS = ['rsi', 'macd', 'fibonacci'] as const
  const advByTopic = TOPICS.map(topic => ({
    topic,
    label: topic === 'rsi' ? 'RSI 심화' : topic === 'macd' ? 'MACD 심화' : '피보나치',
    start: cnt(events, `advanced_${topic}_started`),
    done:  cnt(events, `advanced_${topic}_completed`),
    steps: (advSteps ?? []).filter(s => s.topic === topic),
  })).map(t => ({ ...t, rate: pct(t.done, t.start) }))

  /* ── 재도전 분포 요약 ─────────────────────────────── */
  const avgRetry = retry
    ? (retry.reduce((s, r) => s + r.retry * r.freq, 0) / Math.max(retry.reduce((s, r) => s + r.freq, 0), 1)).toFixed(1)
    : '–'

  return (
    <div className="space-y-6 pb-12">
      {/* 설정 안내 */}
      {!IS_POSTHOG_CONFIGURED && <ConfigBanner />}

      {/* ════════════════════════════════════════════
          1. KPI 카드
      ════════════════════════════════════════════ */}
      <section id="kpi">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-navi-muted mb-3">
          핵심 지표 — 최근 30일
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <KPICard label="오늘 페이지뷰"       value={pageviewsToday.toLocaleString()} sub="오늘 기준" accent />
          <KPICard label="30일 페이지뷰"       value={pageviews30.toLocaleString()}    sub="최근 30일" />
          <KPICard label="30일 방문자"         value={visitors30.toLocaleString()}     sub="유니크 사용자" />
          <KPICard label="튜토리얼 시작"       value={tutStart30.toLocaleString()}     sub="30일" />
          <KPICard label="튜토리얼 완료"       value={tutDone30.toLocaleString()}      sub="30일" accent />
          <KPICard
            label="튜토리얼 완료율"
            value={`${tutRate}%`}
            sub={`${tutStart30} → ${tutDone30}명`}
            accent={tutRate >= 50}
            alert={tutRate < 30}
            pct={tutRate}
          />
          <KPICard label="챌린지 시작"         value={chalStart30.toLocaleString()}  sub="30일" />
          <KPICard label="챌린지 완료"         value={chalDone30.toLocaleString()}   sub="30일" accent />
          <KPICard
            label="챌린지 완료율"
            value={`${chalRate}%`}
            sub={`${chalStart30} → ${chalDone30}명`}
            accent={chalRate >= 50}
            alert={chalRate < 30}
            pct={chalRate}
          />
          <KPICard label="추가학습 시작"       value={advStart30.toLocaleString()}   sub="3과목 합산" />
          <KPICard label="추가학습 완료"       value={advDone30.toLocaleString()}    sub="30일" accent />
          <KPICard
            label="추가학습 완료율"
            value={`${advRate}%`}
            sub={`${advStart30} → ${advDone30}명`}
            accent={advRate >= 50}
            alert={advRate < 30}
            pct={advRate}
          />
          <KPICard label="챌린지 재도전"       value={retryCount30.toLocaleString()} sub="총 재도전 횟수" />
          <KPICard label="평균 재도전 횟수"    value={avgRetry}                       sub="세션당" />
          <KPICard label="지표 활성화"         value={cnt(events, 'indicator_enabled').toLocaleString()} sub="30일" />
        </div>
      </section>

      {/* ════════════════════════════════════════════
          2. 방문자 추이
      ════════════════════════════════════════════ */}
      <SectionCard id="trend" title="방문자 추이" sub="최근 30일 · 방문자 및 페이지뷰">
        {trend ? <LineChart data={trend} /> : <NotConfigured message="PostHog API 연결 후 표시됩니다." />}
      </SectionCard>

      {/* ════════════════════════════════════════════
          3. 학습 퍼널
      ════════════════════════════════════════════ */}
      <SectionCard id="funnel" title="학습 퍼널" sub="홈 방문 → 챌린지 완료 전 과정 · 최근 30일">
        {events
          ? <FunnelChart steps={funnelSteps} />
          : <NotConfigured message="PostHog API 연결 후 표시됩니다." />
        }
      </SectionCard>

      {/* ════════════════════════════════════════════
          4. 기초 튜토리얼 단계별 이탈
      ════════════════════════════════════════════ */}
      <SectionCard id="steps" title="기초 튜토리얼 단계별 이탈" sub="tutorial_step_viewed 기준 · 최근 30일 · 빨간 강조 = 이전 단계 대비 70% 미만 도달">
        {steps
          ? <StepDropoff steps={steps} />
          : <NotConfigured message="PostHog API 연결 후 표시됩니다." />
        }
      </SectionCard>

      {/* ════════════════════════════════════════════
          5. 심화 학습 분석
      ════════════════════════════════════════════ */}
      <SectionCard id="advanced" title="심화 학습 분석" sub="RSI · MACD · 피보나치 각 과정 시작/완료 및 단계별 이탈">
        {events ? (
          <div className="space-y-6">
            {/* 과정별 KPI */}
            <div className="grid grid-cols-3 gap-3">
              {advByTopic.map(t => (
                <div key={t.topic} className="bg-navi-surface2 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-navi-muted mb-1">{t.label}</p>
                  <div className="flex items-end gap-2">
                    <span className="text-[20px] font-black text-navi-text">{t.rate}%</span>
                    <span className="text-[11px] text-navi-muted pb-1">완료율</span>
                  </div>
                  <p className="text-[11px] text-navi-secondary mt-1">{t.start}명 시작 → {t.done}명 완료</p>
                  <div className="mt-2 h-1 bg-navi-border rounded-full overflow-hidden">
                    <div className="h-full bg-navi-action rounded-full" style={{ width: `${t.rate}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* 단계별 이탈 */}
            {advByTopic.map(t => t.steps.length > 0 && (
              <StepDropoff key={t.topic} steps={t.steps} title={`${t.label} 단계별`} />
            ))}
          </div>
        ) : <NotConfigured message="PostHog API 연결 후 표시됩니다." />}
      </SectionCard>

      {/* ════════════════════════════════════════════
          6. 퀴즈 정답률
      ════════════════════════════════════════════ */}
      <SectionCard id="quiz" title="퀴즈 정답률 분석" sub="tutorial_judgment_answered + comprehensive_test_answered · 낮은 정답률 순 정렬">
        {judgment || testAcc ? (
          <div className="grid sm:grid-cols-2 gap-6">
            {/* 판단형 퀴즈 */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-navi-muted mb-3">판단형 퀴즈 (정답률 낮은 순)</p>
              {judgment && judgment.length > 0 ? (
                <HBarChart
                  unit="%"
                  maxVal={100}
                  bars={judgment.slice(0, 10).map(j => ({
                    label: j.step_id.replace(/^(rsi|macd|bb|ma|trend|fib)-/, '').replace(/-/g, ' '),
                    value: j.rate,
                    sub:   `${j.total}회`,
                    alert: j.rate < 50,
                  }))}
                />
              ) : <p className="text-[12px] text-navi-muted">데이터 없음</p>}
            </div>

            {/* 종합 테스트 */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-navi-muted mb-3">종합 테스트 문항</p>
              {testAcc && testAcc.length > 0 ? (
                <HBarChart
                  unit="%"
                  maxVal={100}
                  bars={testAcc.map(t => ({
                    label: t.qid,
                    value: t.rate,
                    sub:   `${t.total}회`,
                    alert: t.rate < 50,
                  }))}
                />
              ) : <p className="text-[12px] text-navi-muted">데이터 없음</p>}
            </div>
          </div>
        ) : <NotConfigured message="PostHog API 연결 후 표시됩니다." />}
      </SectionCard>

      {/* ════════════════════════════════════════════
          7. 지표 사용 분석
      ════════════════════════════════════════════ */}
      <SectionCard id="indicator" title="지표 사용 분석" sub="indicator_enabled + drawing_tool_used · 최근 30일">
        {indicators || drawings ? (
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-navi-muted mb-3">분석 지표</p>
              <HBarChart
                unit="회"
                bars={(indicators ?? []).map(i => ({ label: i.indicator, value: i.cnt }))}
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-navi-muted mb-3">작도 도구</p>
              <HBarChart
                unit="회"
                bars={(drawings ?? []).map(d => ({
                  label: d.tool === 'trendline' ? '추세선' : d.tool === 'fibonacci' ? '피보나치' : d.tool,
                  value: d.cnt,
                }))}
              />
            </div>
          </div>
        ) : <NotConfigured message="PostHog API 연결 후 표시됩니다." />}
      </SectionCard>

      {/* ════════════════════════════════════════════
          8. 실전 챌린지 분석
      ════════════════════════════════════════════ */}
      <SectionCard id="challenge" title="실전 챌린지 분석" sub="challenge_* + simulation_retry · 최근 30일">
        {events ? (
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              {[
                { label: '챌린지 시작',     value: chalStart30 },
                { label: '챌린지 완료',     value: chalDone30 },
                { label: '완료율',          value: `${chalRate}%` },
                { label: '총 재도전',       value: retryCount30 },
                { label: '평균 재도전',     value: avgRetry },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-navi-border/40">
                  <span className="text-[12px] text-navi-secondary">{row.label}</span>
                  <span className="text-[14px] font-bold text-navi-text">{String(row.value)}</span>
                </div>
              ))}
            </div>

            {retry && retry.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-navi-muted mb-3">재도전 횟수 분포</p>
                <HBarChart
                  unit="명"
                  bars={retry.map(r => ({ label: `${r.retry}회 재도전`, value: r.freq }))}
                />
              </div>
            )}
          </div>
        ) : <NotConfigured message="PostHog API 연결 후 표시됩니다." />}
      </SectionCard>

      {/* ════════════════════════════════════════════
          9. 최근 이벤트 로그 (60초 자동 갱신)
      ════════════════════════════════════════════ */}
      <SectionCard id="log" title="사용자 행동 로그" sub="최근 24시간 · 60초마다 자동 갱신 · 최대 100건">
        <EventLog initialData={recentEvt} />
      </SectionCard>

      {/* ════════════════════════════════════════════
          10. Session Replay 연결
      ════════════════════════════════════════════ */}
      <SectionCard id="replay" title="Session Replay" sub="PostHog에서 실제 녹화 영상 확인">
        <div className="space-y-3">
          <p className="text-[12px] text-navi-secondary leading-relaxed">
            Session Replay는 PostHog 대시보드에서 직접 확인하세요.<br />
            아래 바로가기로 이동하거나, 특정 이벤트 기준으로 세션을 필터링할 수 있습니다.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                label: '전체 세션 목록',
                href:  'https://us.posthog.com/recordings',
                desc:  '모든 녹화 세션 확인',
              },
              {
                label: 'MACD 퀴즈 오답 세션',
                href:  'https://us.posthog.com/recordings?filters=%5B%7B"id"%3A"tutorial_judgment_answered","type"%3A"events","order"%3A0,"name"%3A"tutorial_judgment_answered","properties"%3A%5B%7B"key"%3A"is_correct","value"%3A%5B"false"%5D%7D%5D%7D%5D',
                desc:  'is_correct=false 필터',
              },
              {
                label: '튜토리얼 이탈 세션',
                href:  'https://us.posthog.com/recordings?filters=%5B%7B"id"%3A"tutorial_exit","type"%3A"events"%7D%5D',
                desc:  'tutorial_exit 필터',
              },
              {
                label: '챌린지 완료 세션',
                href:  'https://us.posthog.com/recordings?filters=%5B%7B"id"%3A"challenge_completed","type"%3A"events"%7D%5D',
                desc:  'challenge_completed 필터',
              },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-start gap-3 p-3 rounded-xl
                  bg-navi-surface2 border border-navi-border
                  hover:border-navi-action/40 hover:bg-navi-action/[0.04]
                  transition-all group
                "
              >
                <div className="mt-0.5 w-5 h-5 rounded-lg bg-navi-action/10 flex items-center justify-center shrink-0">
                  <span className="text-[11px]">▶</span>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-navi-text group-hover:text-navi-action transition-colors">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-navi-muted">{item.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
