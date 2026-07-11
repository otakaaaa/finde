import { useState } from 'react'
import { cn } from '@/lib/utils'
import { type FaqItem, FAQ_CATEGORIES } from './faqData'
import { Seo } from '@/components/seo/Seo'

// ── Accordion Item ────────────────────────────────────────────────────────

const AccordionItem = ({
  item,
  num,
  isOpen,
  onToggle,
}: {
  item: FaqItem
  num: string
  isOpen: boolean
  onToggle: () => void
}) => (
  <div
    className={cn(
      'group border-b border-border transition-colors duration-200',
      isOpen && 'bg-muted/20',
    )}
  >
    <button
      onClick={onToggle}
      className="flex w-full items-start gap-4 p-5 text-left"
      aria-expanded={isOpen}
    >
      <span className={cn(
        'mt-0.5 shrink-0 font-mono text-[10px] tabular-nums transition-colors duration-200',
        isOpen ? 'text-primary' : 'text-muted-foreground/25',
      )}>
        {num}
      </span>
      <span className={cn(
        'flex-1 text-sm font-semibold leading-snug transition-colors duration-200',
        isOpen ? 'text-foreground' : 'text-foreground/80',
      )}>
        {item.q}
      </span>
      <span className={cn(
        'mt-0.5 ml-2 shrink-0 text-muted-foreground/40 transition-all duration-300',
        isOpen && 'rotate-45 text-primary',
      )}>
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
        </svg>
      </span>
    </button>

    {/* CSS grid trick for smooth height animation */}
    <div
      className="grid transition-all duration-300 ease-in-out"
      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">
        <div className="pb-5 pl-[calc(theme(spacing.4)+theme(spacing.10))] pr-8">
          <div className={cn(
            'border-l-2 pl-4 transition-colors duration-200',
            isOpen ? 'border-primary/30' : 'border-transparent',
          )}>
            <p className="whitespace-pre-wrap text-sm leading-[1.85] text-muted-foreground">
              {item.a}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// ── Page ──────────────────────────────────────────────────────────────────

const FaqPage = () => {
  const [activeCategoryId, setActiveCategoryId] = useState(FAQ_CATEGORIES[0].id)
  const [openItemId, setOpenItemId] = useState<string | null>(null)

  const activeCategory = FAQ_CATEGORIES.find((c) => c.id === activeCategoryId) ?? FAQ_CATEGORIES[0]

  const handleCategorySelect = (id: string) => {
    setActiveCategoryId(id)
    setOpenItemId(null)
  }

  const handleToggle = (id: string) => {
    setOpenItemId((prev) => (prev === id ? null : id))
  }

  const totalQuestions = FAQ_CATEGORIES.reduce((acc, c) => acc + c.items.length, 0)

  return (
    <div className="bg-background">
      <Seo
        title="よくあるご質問"
        description="FINDEの使い方・店舗掲載・オーナー登録などに関するよくある質問と回答をまとめています。"
        path="/faq"
      />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-foreground/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            FAQ
          </span>
        </div>
        <div className="relative mx-auto max-w-4xl">
          <div className="pb-8 pt-2">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.5em] text-foreground/30">
              — Help
            </p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground md:text-4xl">
              よくあるご質問
            </h1>
            <p className="mt-3 text-[11px] text-foreground/30">
              {FAQ_CATEGORIES.length}カテゴリ・{totalQuestions}件の回答
            </p>
          </div>
        </div>
      </section>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-16 md:py-16">

        {/* Category filter */}
        <div className="mb-10 flex flex-wrap gap-2">
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={cn(
                'rounded-sm border px-3 py-1.5 text-[11px] font-bold transition-all duration-150',
                activeCategoryId === cat.id
                  ? 'border-primary bg-primary text-white'
                  : 'border-border text-muted-foreground/60 hover:border-primary/30 hover:text-foreground',
              )}
            >
              {cat.label}
              <span className={cn(
                'ml-2 font-mono text-[9px] tabular-nums transition-colors',
                activeCategoryId === cat.id ? 'text-white/50' : 'text-muted-foreground/30',
              )}>
                {cat.items.length}
              </span>
            </button>
          ))}
        </div>

        {/* Category heading */}
        <div className="mb-6 flex items-baseline gap-3">
          <h2 className="font-headline text-lg font-black tracking-tight text-foreground">
            {activeCategory.label}
          </h2>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground/30">
            {activeCategory.items.length}件
          </span>
        </div>

        {/* Accordion */}
        <div className="rounded-sm border border-border">
          {activeCategory.items.map((item, idx) => (
            <AccordionItem
              key={item.id}
              item={item}
              num={String(idx + 1).padStart(2, '0')}
              isOpen={openItemId === item.id}
              onToggle={() => handleToggle(item.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-border pt-10">
          <p className="mb-1 font-headline text-sm font-black text-foreground">
            解決しない場合は
          </p>
          <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground/60">
            お探しの回答が見つからない場合は、お問い合わせフォームよりご連絡ください。
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-[11px] font-bold text-foreground/70 transition-colors hover:border-primary hover:text-primary"
          >
            お問い合わせフォームへ
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10m-4-4 4 4-4 4" />
            </svg>
          </a>
        </div>

      </div>
    </div>
  )
}

export default FaqPage
