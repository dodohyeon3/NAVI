/**
 * admin-auth.ts — 관리자 인증 토큰 유틸
 *
 * Edge Runtime (middleware) + Node.js Runtime (API routes) 양쪽에서 동작.
 * Web Crypto API (crypto.subtle) 사용 — 외부 패키지 불필요.
 *
 * 토큰 = HMAC-SHA256(ADMIN_PASSWORD, "navi-admin-v1") hex 문자열
 * 쿠키 이름 = admin-auth
 */

export const COOKIE_NAME = 'admin-auth'
const HMAC_KEY_MATERIAL  = 'navi-admin-v1'

/** ADMIN_PASSWORD env var 기반 인증 토큰 생성 */
export async function computeToken(password: string): Promise<string> {
  const enc     = new TextEncoder()
  const keyData = enc.encode(HMAC_KEY_MATERIAL)
  const msgData = enc.encode(password)

  const key = await crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, msgData)
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** 현재 환경변수 기준 예상 토큰 */
export async function getExpectedToken(): Promise<string> {
  return computeToken(process.env.ADMIN_PASSWORD ?? '')
}

/** 쿠키 값이 유효한지 검증 */
export async function isValidToken(token: string): Promise<boolean> {
  const expected = await getExpectedToken()
  return token === expected
}
