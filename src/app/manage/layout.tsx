import type { Metadata } from 'next'
import { AdminNav } from './AdminNav'

export const metadata: Metadata = {
  title: 'NAVI Admin',
  // 검색엔진 색인 완전 차단
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navi-bg">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  )
}
