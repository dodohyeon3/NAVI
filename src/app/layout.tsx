import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NAVI Chart — 처음 시작하는 주식 차트',
  description: '복잡한 차트, 이제 쉽게 읽어요. 초보 투자자를 위한 주식 차트 분석 서비스.',
}

/**
 * 테마 플래시(FOUC) 방지 인라인 스크립트
 * React 하이드레이션 전에 실행되어 올바른 테마 클래스를 적용합니다.
 */
const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('navi-theme');
    var mode = stored ? JSON.parse(stored).state?.mode : 'dark';
    if (mode === 'light') document.documentElement.classList.add('light');
  } catch(e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
