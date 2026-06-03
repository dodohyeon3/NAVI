import { ReactNode } from 'react'

interface Props {
  title:    string
  sub?:     string
  id?:      string
  children: ReactNode
}

export function SectionCard({ title, sub, id, children }: Props) {
  return (
    <section id={id} className="bg-navi-surface border border-navi-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-navi-border bg-navi-surface2/40">
        <h2 className="text-[13px] font-bold text-navi-text">{title}</h2>
        {sub && <p className="text-[11px] text-navi-muted mt-0.5">{sub}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

/** 데이터 미설정 안내 */
export function NotConfigured({ message }: { message: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-[12px] text-navi-muted">{message}</p>
    </div>
  )
}
