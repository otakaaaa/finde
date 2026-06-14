import { Link } from 'react-router'
import { FindeLogo } from '@/components/icons/FindeLogo'

const NAV_COLUMNS = [
  {
    label: 'Browse',
    links: [
      { to: '/shops', text: '店舗を探す' },
      { to: '/share', text: 'シャレ活' },
    ],
  },
  {
    label: 'Service',
    links: [
      { to: '/news', text: 'お知らせ' },
      { to: '/listing-request', text: '店舗掲載申請' },
      { to: '/mypage', text: 'マイページ' },
      { to: '/mypage/favorites', text: 'お気に入り' },
      { to: '/faq', text: 'よくあるご質問' },
      { to: '/contact', text: 'お問い合わせ' },
      { to: '/about', text: 'このサービスについて' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { to: '/terms', text: '利用規約' },
      { to: '/privacy', text: 'プライバシーポリシー' },
    ],
  },
]

export const Footer = () => (
  <footer className="relative overflow-hidden bg-primary">

    {/* Watermark */}
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-0 left-0 select-none leading-none"
    >
      <span
        className="font-headline font-black tracking-tighter text-white/[0.03]"
        style={{ fontSize: 'clamp(100px, 22vw, 220px)', lineHeight: 0.85 }}
      >
        FINDE
      </span>
    </div>

    {/* Main content */}
    <div className="relative mx-auto max-w-5xl px-6 pb-10 pt-14 md:px-16">

      {/* Top row: logo + nav grid */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_2fr]">

        {/* Brand column */}
        <div className="flex flex-col justify-between gap-8">
          <div>
            {/* Logo */}
            <div className="mb-5">
              <FindeLogo size="md" variant="inverse" />
            </div>

            {/* Tagline */}
            <p className="max-w-[164px] text-[11px] leading-relaxed text-white/35">
              古着・セレクトショップの探し方が変わる。
            </p>
          </div>

          {/* CTA */}
          <Link
            to="/listing-request"
            className="group inline-flex w-fit items-center gap-2 border border-white/20 px-4 py-2.5 transition-colors duration-150 hover:border-white/50 hover:bg-white/5"
          >
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-white/60 transition-colors group-hover:text-white/90">
              店舗掲載申請
            </span>
            <span className="font-headline text-[9px] font-black text-white/20 transition-colors group-hover:text-white/40">
              →
            </span>
          </Link>
        </div>

        {/* Nav columns */}
        <div className="grid grid-cols-3 gap-6">
          {NAV_COLUMNS.map((col) => (
            <div key={col.label}>
              <p className="mb-4 font-headline text-[9px] font-black uppercase tracking-[0.4em] text-white/25">
                {col.label}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[11px] text-white/45 transition-colors duration-100 hover:text-white/80"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>

      {/* Bottom strip */}
      <div className="mt-12 flex flex-col items-start gap-2 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-headline text-[9px] font-black tabular-nums tracking-[0.3em] text-white/20">
          © 2026 FINDE
        </span>
        <span className="font-headline text-[9px] font-bold uppercase tracking-[0.2em] text-white/15">
          古着 · セレクト ・ ユニセックス
        </span>
      </div>

    </div>
  </footer>
)
