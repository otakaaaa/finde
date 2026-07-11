import { useState, useEffect, useRef, type ReactElement } from 'react'
import { cn } from '@/lib/utils'
import { type PrivacySection, type PrivacyVersion, PRIVACY_VERSIONS } from './privacyVersions'
import { Seo } from '@/components/seo/Seo'

// ── Icons ─────────────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, ReactElement> = {
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
  collect: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
    </svg>
  ),
  purpose: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
    </svg>
  ),
  share: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
    </svg>
  ),
  cookie: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  ),
  update: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  ),
}

// ── Sub-components ────────────────────────────────────────────────────────

const TableOfContents = ({
  sections,
  activeId,
  onSelect,
}: {
  sections: PrivacySection[]
  activeId: string
  onSelect: (id: string) => void
}) => (
  <nav className="space-y-px">
    <p className="mb-4 text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
      目次
    </p>
    {sections.map((s) => (
      <button
        key={s.id}
        onClick={() => onSelect(s.id)}
        className={cn(
          'group flex w-full items-center gap-2.5 py-1.5 text-left transition-all duration-150',
          activeId === s.id
            ? 'text-foreground'
            : 'text-muted-foreground/35 hover:text-muted-foreground/65',
        )}
      >
        <span className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm transition-colors',
          activeId === s.id ? 'text-foreground' : 'text-muted-foreground/30',
        )}>
          {SECTION_ICONS[s.icon]}
        </span>
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
      {PRIVACY_VERSIONS.map((v, idx) => (
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

const PrivacyPolicyPage = () => {
  const [versionIdx, setVersionIdx] = useState(0)
  const [activeId, setActiveId] = useState('')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const version: PrivacyVersion = PRIVACY_VERSIONS[versionIdx]
  const isLatest = versionIdx === 0

  useEffect(() => {
    setActiveId(version.sections[0]?.id ?? '')
    window.scrollTo({ top: 0 })
  }, [versionIdx, version.sections])

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
        title="プライバシーポリシー"
        description="FINDEのプライバシーポリシー。お客様の個人情報の取り扱いについてご説明します。"
        path="/privacy"
      />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-foreground/[0.04]"
            style={{ fontSize: 'clamp(60px, 11vw, 130px)' }}
          >
            PRIVACY
          </span>
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="pb-8 pt-2">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.5em] text-foreground/30">
              — Legal
            </p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground md:text-4xl">
              プライバシーポリシー
            </h1>
            <p className="mt-3 text-[11px] text-foreground/30">
              発効日: {version.effectiveDate}
              {!isLatest && (
                <span className="ml-3 inline-flex items-center gap-1 rounded-sm bg-foreground/10 px-2 py-0.5 font-headline text-[9px] font-black uppercase tracking-wide text-foreground/50">
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
          <main className="min-w-0 space-y-0 divide-y divide-border">

            {/* Mobile: version switcher */}
            <div className="mb-8 flex flex-wrap items-center gap-2 lg:hidden">
              <span className="text-[9px] font-black text-muted-foreground/30">
                版を選択
              </span>
              {PRIVACY_VERSIONS.map((v, idx) => (
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
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/30 text-muted-foreground/50">
                    {SECTION_ICONS[section.icon]}
                  </div>
                  <div>
                    <p className="mb-0.5 font-mono text-[9px] tabular-nums text-muted-foreground/25">
                      {section.num}
                    </p>
                    <h2 className="font-headline text-xl font-black leading-none tracking-tight text-foreground">
                      {section.title}
                    </h2>
                  </div>
                </div>

                <div className="space-y-6 pl-12">
                  {section.content.map((item, idx) => (
                    <div key={idx}>
                      {item.heading && (
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/45">
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
                  本ポリシー（{version.label}）は{version.effectiveDate}より施行されます。<br />
                  個人情報の取り扱いに関するお問い合わせは
                  <a href="/contact" className="underline underline-offset-2 hover:text-muted-foreground/70">
                    お問い合わせフォーム
                  </a>
                  よりご連絡ください。
                </p>
                <a
                  href="/terms"
                  className="shrink-0 text-[10px] text-muted-foreground/30 underline underline-offset-2 hover:text-muted-foreground/60"
                >
                  利用規約を確認 →
                </a>
              </div>
            </div>

          </main>
        </div>
      </div>

    </div>
  )
}

export default PrivacyPolicyPage
