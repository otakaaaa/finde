import { Link } from 'react-router'
import { FindeLogo } from '@/components/icons/FindeLogo'
import { XLogo } from '@/components/icons/XLogo'
import { SITE } from '@/config/site'

const NAV_COLUMNS = [
  {
    label: 'Browse',
    links: [
      { to: '/shops', text: '店舗を探す' },
      { to: '/brands', text: 'ブランドから探す' },
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

/**
 * Instagram風の白基調フッター。
 * モバイルはボトムタブバーがあるため非表示（md以上のみ表示）。
 */
export const Footer = () => (
  <footer className="relative hidden overflow-hidden border-t border-border bg-background md:block">
    {/* Watermark */}
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-0 left-0 select-none leading-none"
    >
      <span
        className="font-headline font-black tracking-tighter text-foreground/[0.03]"
        style={{ fontSize: 'clamp(100px, 22vw, 220px)', lineHeight: 0.85 }}
      >
        FINDE
      </span>
    </div>

    <div className="relative mx-auto max-w-[975px] px-6 pb-8 pt-10">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_2fr]">
        {/* Brand column */}
        <div className="flex flex-col gap-5">
          <FindeLogo size="md" />
          <p className="max-w-[200px] text-xs leading-relaxed text-muted-foreground">
            古着・セレクトショップの探し方が変わる。
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/listing-request"
              className="inline-flex h-8 items-center rounded-lg bg-muted px-3 text-xs font-bold text-foreground transition-colors hover:bg-border/60"
            >
              店舗掲載申請
            </Link>
            <a
              href={SITE.social.x}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="FINDE公式X"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted transition-colors hover:bg-border/60"
            >
              <XLogo className="h-3.5 w-3.5 text-foreground/70" />
            </a>
          </div>
        </div>

        {/* Nav columns */}
        <div className="grid grid-cols-3 gap-6">
          {NAV_COLUMNS.map((col) => (
            <div key={col.label}>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {col.label}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
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
      <div className="mt-10 flex items-center justify-between border-t border-border pt-5">
        <span className="text-[11px] tabular-nums text-muted-foreground">© 2026 FINDE</span>
        <span className="text-[11px] text-muted-foreground/70">古着 · セレクト · ユニセックス</span>
      </div>
    </div>
  </footer>
)
