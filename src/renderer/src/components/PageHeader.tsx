import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, actions }: { eyebrow?: string; title: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        {eyebrow && <div className="mb-1.5 font-mono-label text-[10.5px] font-semibold tracking-wide text-text-dim">{eyebrow}</div>}
        <div className="text-xl font-semibold text-text">{title}</div>
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  )
}
