'use client'

import { useTheme } from '@/hooks/useTheme'
import { clsx } from 'clsx'

const MODES = [
  { value: 'dark'  as const, label: 'Dark'  },
  { value: 'light' as const, label: 'Light' },
] as const

export function ThemeToggle() {
  const { mode, setMode } = useTheme()

  return (
    <div
      className="flex items-center p-0.5 rounded-lg
                 bg-navi-surface2 border border-navi-border"
      aria-label="테마 선택"
    >
      {MODES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setMode(value)}
          aria-pressed={mode === value}
          className={clsx(
            'h-6 px-2.5 rounded-md text-[11px] font-semibold',
            'transition-all duration-150',
            mode === value
              ? 'bg-navi-surface text-navi-text shadow-sm border border-navi-border'
              : 'text-navi-muted hover:text-navi-secondary',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
