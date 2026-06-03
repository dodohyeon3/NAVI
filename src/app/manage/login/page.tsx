'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const router      = useRouter()
  const params      = useSearchParams()
  const from        = params.get('from') ?? '/manage'
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const res = await fetch('/api/manage/auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: pw }),
      })
      if (res.ok) {
        router.replace(from)
      } else {
        const d = await res.json() as { error?: string }
        setErr(d.error ?? '로그인에 실패했습니다.')
      }
    } catch {
      setErr('서버 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-navi-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* 브랜드 */}
        <div className="text-center mb-8">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-navi-muted mb-1">
            NAVI Chart
          </p>
          <h1 className="text-[22px] font-black text-navi-text">Admin Dashboard</h1>
          <p className="text-[12px] text-navi-muted mt-1">운영자 전용 페이지입니다.</p>
        </div>

        {/* 로그인 카드 */}
        <form
          onSubmit={handleSubmit}
          className="bg-navi-surface border border-navi-border rounded-2xl p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-navi-muted uppercase tracking-[0.08em]">
              관리자 비밀번호
            </label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="비밀번호 입력"
              autoFocus
              required
              className="
                w-full h-11 px-3.5 rounded-xl text-[13px]
                bg-navi-surface2 border border-navi-border2
                text-navi-text placeholder:text-navi-muted
                focus:outline-none focus:border-navi-action/60 focus:ring-1 focus:ring-navi-action/30
                transition-all
              "
            />
          </div>

          {err && (
            <p className="text-[12px] text-navi-danger bg-navi-danger/[0.08] border border-navi-danger/25 rounded-lg px-3 py-2">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !pw}
            className="
              w-full h-11 rounded-xl text-[13px] font-bold
              bg-navi-action text-white
              hover:bg-navi-action-hover transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-[0.98]
            "
          >
            {busy ? '확인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-[11px] text-navi-muted mt-5">
          ADMIN_PASSWORD 환경변수로 설정된 비밀번호를 입력하세요.
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
