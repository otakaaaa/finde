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
      { to: '/mypage/follows', text: 'フォロー中のお店' },
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
 * md以上はフル表示、モバイルは利用規約等へのアクセスを保証するためコンパクト版を表示する
 * （ボトムタブバーがあるためフル表示はしない）。
 */
export const Footer = () => (
  <footer className="relative overflow-hidden border-t border-border bg-background">
    {/* Watermark */}
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-0 left-0 hidden select-none leading-none md:block"
    >
      <span
        className="font-headline font-black tracking-tighter text-foreground/[0.03]"
        style={{ fontSize: 'clamp(100px, 22vw, 220px)', lineHeight: 0.85 }}
      >
        FINDE
      </span>
    </div>

    {/* ── モバイル: コンパクト版（規約等への導線を保証） ──
        固定ボトムタブバー(h-12 + safe-area)に隠れないよう下余白を確保する */}
    <div className="relative px-4 pt-6 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {[
          { to: '/terms', text: '利用規約' },
          { to: '/privacy', text: 'プライバシーポリシー' },
          { to: '/faq', text: 'よくあるご質問' },
          { to: '/contact', text: 'お問い合わせ' },
          { to: '/listing-request', text: '店舗掲載申請' },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.text}
          </Link>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-[11px] tabular-nums text-muted-foreground/70">© 2026 FINDE</p>
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

    {/* ── md以上: フル版 ── */}
    <div className="relative mx-auto hidden max-w-[975px] px-6 pb-8 pt-10 md:block">
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
