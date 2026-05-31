'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  open:       boolean
  onClose:    () => void
  title?:     string
  children:   React.ReactNode
  maxHeight?: string
}

/**
 * 재사용 가능한 모바일 Bottom Sheet
 * - 스프링 애니메이션으로 자연스럽게 슬라이드 업
 * - 백드롭 클릭 시 닫힘
 * - body scroll 잠금
 */
export function MobileBottomSheet({
  open,
  onClose,
  title,
  children,
  maxHeight = '70vh',
}: Props) {
  /* body scroll 잠금 */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">

          {/* ── 백드롭 ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* ── 시트 본체 ───────────────────────────────────── */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{ maxHeight }}
            className="relative bg-navi-surface border-t border-navi-border
                       rounded-t-2xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 드래그 핸들 */}
            <div className="flex-shrink-0 flex justify-center pt-2.5 pb-1">
              <div className="w-9 h-[3px] rounded-full bg-navi-border2" />
            </div>

            {/* 헤더 */}
            {title && (
              <div className="flex-shrink-0 flex items-center justify-between
                              px-5 py-3 border-b border-navi-border">
                <p className="text-[15px] font-bold text-navi-text">{title}</p>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl
                             text-[15px] text-navi-muted hover:text-navi-text
                             hover:bg-navi-surface2 transition-all"
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
            )}

            {/* 스크롤 가능한 콘텐츠 */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
