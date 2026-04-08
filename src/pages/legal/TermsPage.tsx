import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// ── Sections data ─────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'general',
    num: '01',
    title: '総則',
    content: [
      {
        heading: null,
        body: `本利用規約（以下「本規約」）は、fukunavi（以下「当サービス」）が提供する古着屋検索サービスの利用条件を定めるものです。ユーザーの皆さまには、本規約に従って当サービスをご利用いただきます。`,
      },
      {
        heading: '規約への同意',
        body: `当サービスを利用することにより、ユーザーは本規約のすべての条項に同意したものとみなされます。本規約に同意いただけない場合は、当サービスの利用をお控えください。`,
      },
      {
        heading: 'サービスの定義',
        body: `当サービスとは、fukunaviが運営する古着屋の検索・情報提供プラットフォームを指します。店舗情報の閲覧、レビューの投稿、お気に入り登録、ウィッシュリスト機能など、当サービスが提供するすべての機能を含みます。`,
      },
    ],
  },
  {
    id: 'registration',
    num: '02',
    title: '利用登録',
    content: [
      {
        heading: '登録の方法',
        body: `当サービスの一部機能は、所定の手続きによりユーザー登録を行うことで利用可能となります。登録申請の際は、真実・正確・最新の情報を提供していただく必要があります。`,
      },
      {
        heading: '登録の拒否',
        body: `当サービスは、以下のいずれかに該当する場合、登録申請を承認しないことがあります。\n\n・登録申請に虚偽の情報が含まれる場合\n・過去に本規約違反により利用停止となったことがある場合\n・その他、当サービスが不適当と判断した場合`,
      },
      {
        heading: 'アカウントの管理',
        body: `ユーザーは、自己の責任においてアカウント情報（メールアドレス・パスワード）を管理するものとします。第三者への譲渡・貸与・共有は禁止します。アカウントの不正使用により生じた損害について、当サービスは一切の責任を負いません。`,
      },
    ],
  },
  {
    id: 'prohibited',
    num: '03',
    title: '禁止事項',
    content: [
      {
        heading: null,
        body: `ユーザーは、当サービスの利用にあたり、以下の行為を行ってはなりません。`,
      },
      {
        heading: '法令・公序良俗違反',
        body: `法令または公序良俗に違反する行為、犯罪行為に関連する行為、当サービス・他のユーザー・第三者の知的財産権・肖像権・プライバシーを侵害する行為。`,
      },
      {
        heading: 'サービスの妨害',
        body: `当サービスのサーバーまたはネットワークの機能を破壊・妨害する行為、当サービスの運営を妨害するおそれのある行為、不正アクセスやクローリング等の行為。`,
      },
      {
        heading: '虚偽情報の投稿',
        body: `店舗情報・レビュー等に虚偽・誇大な情報を投稿する行為、他者を誹謗中傷する内容を含む行為、商業的宣伝・広告・勧誘を目的とした行為。`,
      },
      {
        heading: 'その他',
        body: `反社会的勢力への利益供与、当サービスが不適当と判断するその他の行為。`,
      },
    ],
  },
  {
    id: 'disclaimer',
    num: '04',
    title: '免責事項',
    content: [
      {
        heading: '情報の正確性',
        body: `当サービスは、掲載する店舗情報・レビュー等の正確性・完全性・有用性について保証しません。掲載情報はユーザーまたは店舗オーナーによって提供されるものであり、内容の真偽については各自でご確認ください。`,
      },
      {
        heading: 'サービスの中断',
        body: `当サービスは、システムの保守・点検・障害・第三者による妨害等により、予告なくサービスを中断することがあります。これによりユーザーに生じた損害について、当サービスは一切の責任を負いません。`,
      },
      {
        heading: '外部サービスとの連携',
        body: `当サービスからリンクされる外部サイトの内容・サービスについて、当サービスは責任を負いません。外部サービスのご利用は各サービスの規約に従ってください。`,
      },
      {
        heading: '損害賠償の制限',
        body: `当サービスの利用または利用不能によりユーザーに生じた損害（間接損害・逸失利益を含む）について、当サービスは責任を負わないものとします。ただし、当サービスの故意または重大な過失による場合はこの限りではありません。`,
      },
    ],
  },
  {
    id: 'changes',
    num: '05',
    title: 'サービスの変更・終了',
    content: [
      {
        heading: 'サービス内容の変更',
        body: `当サービスは、ユーザーへの事前通知なく、サービスの内容を変更・追加・廃止することがあります。これによりユーザーに生じた損害について、当サービスは責任を負いません。`,
      },
      {
        heading: 'サービスの終了',
        body: `当サービスは、サービスを終了する場合、原則として事前にユーザーへ通知します。ただし、緊急の事情がある場合はこの限りではありません。`,
      },
    ],
  },
  {
    id: 'terms-change',
    num: '06',
    title: '利用規約の変更',
    content: [
      {
        heading: null,
        body: `当サービスは、必要と判断した場合には、ユーザーへの事前通知なく本規約を変更することがあります。変更後の規約は、当サービス上に掲示した時点から効力を生じます。変更後の規約に同意いただけない場合は、当サービスの利用を中止してください。引き続き当サービスを利用された場合、変更後の規約に同意したものとみなします。`,
      },
    ],
  },
  {
    id: 'governing',
    num: '07',
    title: '準拠法・管轄裁判所',
    content: [
      {
        heading: null,
        body: `本規約の解釈にあたっては、日本法を準拠法とします。当サービスに関して生じた紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。`,
      },
    ],
  },
]

// ── Components ────────────────────────────────────────────────────────────

const TableOfContents = ({
  activeId,
  onSelect,
}: {
  activeId: string
  onSelect: (id: string) => void
}) => (
  <nav className="space-y-px">
    <p className="mb-4 text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">
      — Contents
    </p>
    {SECTIONS.map((s) => (
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

// ── Page ──────────────────────────────────────────────────────────────────

const TermsPage = () => {
  const [activeId, setActiveId] = useState(SECTIONS[0].id)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id]
    if (el) {
      const offset = 80
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <div className="bg-background">

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
              発効日: 2026年4月8日
            </p>
          </div>
        </div>
      </section>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-16 md:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[200px_1fr]">

          {/* ── TOC sidebar ─────────────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-[calc(56px+24px)]">
              <TableOfContents activeId={activeId} onSelect={scrollTo} />

              <div className="mt-10 border-t border-border pt-6">
                <p className="text-[9px] leading-relaxed text-muted-foreground/30">
                  本規約に関するお問い合わせは
                  <a href="/contact" className="underline underline-offset-2 hover:text-muted-foreground/60">
                    こちら
                  </a>
                  よりご連絡ください。
                </p>
              </div>
            </div>
          </aside>

          {/* ── Main content ────────────────────────────────── */}
          <main className="min-w-0 space-y-0 divide-y divide-border">
            {SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                ref={(el) => { sectionRefs.current[section.id] = el }}
                className="py-12 first:pt-0"
              >
                {/* Section header */}
                <div className="mb-8 flex items-center gap-4">
                  <span className="font-headline text-[11px] font-black tabular-nums text-muted-foreground/20">
                    {section.num}
                  </span>
                  <div>
                    <h2 className="font-headline text-xl font-black leading-none tracking-tight text-foreground">
                      {section.title}
                    </h2>
                  </div>
                </div>

                {/* Section content */}
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

            {/* Footer note */}
            <div className="py-12">
              <p className="text-[10px] leading-relaxed text-muted-foreground/40">
                本規約は2026年4月8日より施行されます。
                <br/>
                ご不明な点がございましたら、
                <a href="/contact" className="underline underline-offset-2 hover:text-muted-foreground/70">
                  お問い合わせフォーム
                </a>
                よりご連絡ください。
              </p>
            </div>
          </main>

        </div>
      </div>

    </div>
  )
}

export default TermsPage
