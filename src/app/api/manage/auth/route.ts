import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, computeToken } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({}))

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return NextResponse.json({ error: 'ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.' }, { status: 500 })
  }

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }

  const token = await computeToken(adminPassword)
  const res   = NextResponse.json({ ok: true })

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 7, // 7일
  })

  return res
}
