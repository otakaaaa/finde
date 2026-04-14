import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router'
import type { ReactNode } from 'react'

interface ShopFormHeaderProps {
  backgroundText: 'CREATE' | 'EDIT'
  context: 'admin' | 'owner'
  backLabel: string
  backLink: string
  title: string
  subtitle?: string
  headerRight?: ReactNode
}

export const ShopFormHeader = ({
  backgroundText,
  context,
  backLabel,
  backLink,
  title,
  subtitle,
  headerRight,
}: ShopFormHeaderProps) => (
  <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
    <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
      <span
        className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
        style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
      >
        {backgroundText}
      </span>
    </div>
    <div className="relative mx-auto max-w-5xl">
      <div className="pb-6">
        <Link
          to={backLink}
          className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
        >
          <ChevronLeft className="h-3 w-3" />
          {backLabel}
        </Link>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
          — {context === 'admin' ? 'Admin' : 'Owner'}
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 truncate text-sm font-medium text-white/50">{subtitle}</p>
            )}
          </div>
          {headerRight}
        </div>
      </div>
    </div>
  </section>
)
