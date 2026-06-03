import { NextRequest, NextResponse } from 'next/server'
import { fetchRecentEvents } from '@/lib/posthog-admin'

/** 클라이언트에서 호출하는 경량 API — 현재는 이벤트 로그 실시간 갱신용 */
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type')

  if (type === 'events') {
    const data = await fetchRecentEvents(100)
    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json({ error: 'unknown type' }, { status: 400 })
}
