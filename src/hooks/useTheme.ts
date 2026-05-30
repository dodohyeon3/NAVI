'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'

/** 현재 테마를 반환하고 html 클래스를 동기화하는 훅 */
export function useTheme() {
  const { mode, setMode } = useThemeStore()
  const isDark = mode === 'dark'

  useEffect(() => {
    const html = document.documentElement
    if (mode === 'light') html.classList.add('light')
    else html.classList.remove('light')
  }, [mode])

  return { mode, isDark, setMode }
}
