'use client'

/**
 * 최근 이벤트 로그 — 60초마다 자동 새로고침
 */

import { useEffect, useState, useTransition } from 'react'

interface LogEntry {
  ts:    string
  event: string
  uid:   string
  props: string
}

const EVENT_COLORS: Record<string, string> = {
  tutorial_started:             'text-navi-action',
  tutorial_completed:           'text-navi-success',
  tutorial_exit:                'text-navi-danger',
  challenge_completed:          'text-navi-success',
  challenge_started:            'text-navi-action',
  simulation_started:           'text-navi-info',
  simulation_retry:             'text-navi-warning',
  indicator_enabled:            'text-navi-accent',
  tutorial_judgment_answered:   'text-navi-secondary',
  comprehensive_test_answered:  'text-navi-secondary',
  '$pageview':                  'text-quiet-45',
  landing_cta_clicked:          'text-navi-accent',
}

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch { return ts.slice(11, 19) }
}

interface Props {
  initialData: LogEntry[] | null
}

export function EventLog({ initialData }: Props) {
  const [logs, setLogs]     = useState<LogEntry[]>(initialData ?? [])
  const [, startTrans]      = useTransition()

  useEffect(() => {
    const interval = setInterval(() => {
      startTrans(() => {
        fetch('/api/manage/stats?type=events')
          .then(r => r.json())
          .then(d => { if (Array.isArray(d.data)) setLogs(d.data) })
          .catch(() => {})
      })
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  if (!initialData) {
    return <p className="text-[12px] text-navi-muted">POSTHOG_PERSONAL_API_KEY 설정 후 표시됩니다.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-navi-border text-[10px] text-navi-muted uppercase tracking-[0.07em]">
            <th className="text-left pb-2 pr-3 font-semibold">시간</th>
            <th className="text-left pb-2 pr-3 font-semibold">이벤트</th>
            <th className="text-left pb-2 pr-3 font-semibold">사용자</th>
            <th className="text-left pb-2 font-semibold">속성</th>
          </tr>
        </thead>
        <tbody>
          {logs.slice(0, 100).map((log, i) => (
            <tr key={i} className="border-b border-navi-border/40 hover:bg-navi-surface2/50 transition-colors">
              <td className="py-1.5 pr-3 text-navi-muted whitespace-nowrap font-mono text-[11px]">
                {formatTime(log.ts)}
              </td>
              <td className={`py-1.5 pr-3 font-semibold whitespace-nowrap ${EVENT_COLORS[log.event] ?? 'text-navi-secondary'}`}>
                {log.event}
              </td>
              <td className="py-1.5 pr-3 text-navi-muted font-mono text-[11px]">
                {log.uid}…
              </td>
              <td className="py-1.5 text-navi-secondary text-[11px]">
                {log.props}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && (
        <p className="py-6 text-center text-[12px] text-navi-muted">최근 24시간 이벤트 없음</p>
      )}
    </div>
  )
}
