import { clsx } from 'clsx'

interface Props {
  level: 1 | 2 | 3
}

const labels = { 1: '쉬움', 2: '보통', 3: '어려움' }

/* 텍스트 색 대신 border 색으로 난이도 표현 (surface approach) */
const colors = {
  1: 'bg-navi-surface2 text-navi-secondary border-navi-success/40',
  2: 'bg-navi-surface2 text-navi-secondary border-navi-border2',
  3: 'bg-navi-surface2 text-navi-secondary border-navi-danger/40',
}

export function DifficultyBadge({ level }: Props) {
  return (
    <span
      className={clsx(
        'text-xs px-2 py-0.5 rounded-full border',
        colors[level]
      )}
    >
      {labels[level]}
    </span>
  )
}
