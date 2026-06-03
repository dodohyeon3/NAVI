import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, getExpectedToken } from '@/lib/admin-auth'

/**
 * /manage/* 경로 보호 미들웨어
 * - /manage/login 은 인증 없이 접근 허용
 * - /api/manage/* 는 미들웨어 제외 (API route 내부에서 별도 검증)
 * - 나머지 /manage/* 는 admin-auth 쿠키 검증 후 허용
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 로그인 페이지 & API는 통과
  if (pathname === '/manage/login') return NextResponse.next()
  if (pathname.startsWith('/api/manage/')) return NextResponse.next()

  // 쿠키 검증
  const cookieValue = request.cookies.get(COOKIE_NAME)?.value ?? ''
  const expected    = await getExpectedToken()

  if (!cookieValue || cookieValue !== expected) {
    const url = new URL('/manage/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/manage/:path*'],
}
