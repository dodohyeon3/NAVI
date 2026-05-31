'use client'

import { useEffect, useState } from 'react'

/**
 * 모바일 뷰포트 감지 훅
 * SSR-safe: 초기값은 false (서버에서는 항상 false)
 */
export function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()

    // MediaQueryList 기반 감지 (resize 이벤트보다 효율적)
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    mq.addEventListener('change', check)
    return () => mq.removeEventListener('change', check)
  }, [breakpoint])

  return isMobile
}
