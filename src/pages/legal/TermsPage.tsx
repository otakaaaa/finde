import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Section, VERSIONS } from './termsVersions'
import { Seo } from '@/components/seo/Seo'

// ── Sub-components ────────────────────────────────────────────────────────

const TableOfContents = ({
  sections,
  activeId,
  onSelect,
}: {
  sections: Section[]
  activeId: string
  onSelect: (id: string) => void
}) => (
  <nav className="space-y-px">
    <p className="mb-4 text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">
      目次
    </p>
    {sections.map((s) => (
      <button
        key={s.id}
        onClick={() => onSelect(s.id)}
        className={cn(
          'flex w-full items-baseline gap-3 py-2 text-left transition-colors',
          activeId === s.id
            ? 'text-foreground'
            : 'text-muted-foreground/40 hover:text-muted-foreground/70',
        )}
      >
        <span className="font-headline text-[9px] font-black tabular-nums">{s.num}</span>
        <span className="text-[11px] font-medium leading-tight">{s.title}</span>
      </button>
    ))}
  </nav>
)

const VersionHistory = ({
  currentIdx,
  onSelect,
}: {
  currentIdx: number
  onSelect: (idx: number) => void
}) => (
  <div>
    <p className="mb-3 text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">
      改訂履歴
    </p>
    <div className="space-y-px">
      {VERSIONS.map((v, idx) => (
        <button
          key={v.date}
          onClick={() => onSelect(idx)}
          className={cn(
            'flex w-full items-center justify-between py-2 text-left transition-colors',
            idx === currentIdx
              ? 'text-foreground'
              : 'text-muted-foreground/40 hover:text-muted-foreground/70',
          )}
        >
          <span className="text-[11px] font-medium">{v.label}</span>
          <span className={cn(
            'font-mono text-[9px] tabular-nums',
            idx === currentIdx ? 'text-muted-foreground/50' : 'text-muted-foreground/25',
          )}>
            {v.date}
          </span>
        </button>
      ))}
    </div>
  </div>
)

// ── Page ──────────────────────────────────────────────────────────────────

const TermsPage = () => {
  const [versionIdx, setVersionIdx] = useState(0)
  const [activeId, setActiveId] = useState('')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const mainRef = useRef<HTMLElement | null>(null)

  const version = VERSIONS[versionIdx]
  const isLatest = versionIdx === 0

  // Reset scroll + active section when switching versions
  useEffect(() => {
    setActiveId(version.sections[0]?.id ?? '')
    window.scrollTo({ top: 0 })
  }, [versionIdx, version.sections])

  // IntersectionObserver for active TOC highlight
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [versionIdx])

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id]
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const handleVersionSelect = (idx: number) => {
    sectionRefs.current = {}
    setVersionIdx(idx)
  }

  return (
    <div className="bg-background">
      <Seo
        title="利用規約"
        description="FINDEの利用規約。本サービスをご利用いただく前にご確認ください。"
        path="/terms"
      />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            TERMS
          </span>
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="pb-8 pt-2">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.5em] text-white/30">
              — Legal
            </p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              利用規約
            </h1>
            <p className="mt-3 text-[11px] text-white/30">
              発効日: {version.effectiveDate}
              {!isLatest && (
                <span className="ml-3 inline-flex items-center gap-1 rounded-sm bg-white/10 px-2 py-0.5 font-headline text-[9px] font-black uppercase tracking-wide text-white/50">
                  旧版
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── Archive banner ──────────────────────────────────── */}
      {!isLatest && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 md:px-16">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <p className="text-xs font-medium text-amber-700">
              これは旧版（{version.label} · {version.effectiveDate}施行）です。
            </p>
            <button
              onClick={() => handleVersionSelect(0)}
              className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 underline underline-offset-2 hover:text-amber-800"
            >
              現行版を見る →
            </button>
          </div>
        </div>
      )}

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-16 md:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[200px_1fr]">

          {/* ── Sidebar ─────────────────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-[calc(56px+24px)] space-y-8">

              <TableOfContents
                sections={version.sections}
                activeId={activeId}
                onSelect={scrollTo}
              />

              <div className="border-t border-border pt-6">
                <VersionHistory currentIdx={versionIdx} onSelect={handleVersionSelect} />
              </div>

              <div className="border-t border-border pt-6">
                <p className="text-[9px] leading-relaxed text-muted-foreground/30">
                  ご不明な点は
                  <a href="/contact" className="underline underline-offset-2 hover:text-muted-foreground/60">
                    こちら
                  </a>
                </p>
              </div>

            </div>
          </aside>

          {/* ── Main ────────────────────────────────────────── */}
          <main ref={mainRef} className="min-w-0 space-y-0 divide-y divide-border">

            {/* Mobile: version switcher */}
            <div className="mb-8 flex flex-wrap items-center gap-2 lg:hidden">
              <span className="text-[9px] font-black text-muted-foreground/30">
                版を選択
              </span>
              {VERSIONS.map((v, idx) => (
                <button
                  key={v.date}
                  onClick={() => handleVersionSelect(idx)}
                  className={cn(
                    'rounded-sm border px-2.5 py-1 text-[10px] font-bold transition-all',
                    idx === versionIdx
                      ? 'border-primary bg-primary text-white'
                      : 'border-border text-muted-foreground hover:border-primary/30',
                  )}
                >
                  {v.label}
                  <span className="ml-1.5 font-mono text-[9px] opacity-60">{v.date}</span>
                </button>
              ))}
            </div>

            {version.sections.map((section) => (
              <section
                key={`${versionIdx}-${section.id}`}
                id={section.id}
                ref={(el) => { sectionRefs.current[section.id] = el }}
                className="py-12 first:pt-0"
              >
                <div className="mb-8 flex items-center gap-4">
                  <span className="font-headline text-[11px] font-black tabular-nums text-muted-foreground/20">
                    {section.num}
                  </span>
                  <h2 className="font-headline text-xl font-black leading-none tracking-tight text-foreground">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-6 pl-8">
                  {section.content.map((item, idx) => (
                    <div key={idx}>
                      {item.heading && (
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
                          — {item.heading}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-[1.9] text-foreground/70">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Footer */}
            <div className="py-12">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-[10px] leading-relaxed text-muted-foreground/40">
                  本規約（{version.label}）は{version.effectiveDate}より施行されます。<br />
                  ご不明な点がございましたら、
                  <a href="/contact" className="underline underline-offset-2 hover:text-muted-foreground/70">
                    お問い合わせフォーム
                  </a>
                  よりご連絡ください。
                </p>
                <a
                  href="/privacy"
                  className="shrink-0 text-[10px] text-muted-foreground/30 underline underline-offset-2 hover:text-muted-foreground/60"
                >
                  プライバシーポリシーを確認 →
                </a>
              </div>
            </div>

          </main>
        </div>
      </div>

    </div>
  )
}

export default TermsPage
