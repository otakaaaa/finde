import { XLogo } from '@/components/icons/XLogo'
import { SITE } from '@/config/site'
import { cn } from '@/lib/utils'

interface FollowXCardProps {
  /** カード上部に表示する小見出し（任意） */
  heading?: string
  /** 補足説明文（任意） */
  description?: string
  className?: string
}

/**
 * FINDE運営の公式Xアカウントへのフォロー導線カード。
 * お知らせ・About・お問い合わせなど、運営の発信に興味を持ちやすい箇所で使う。
 */
export const FollowXCard = ({
  heading = '最新情報はXでも発信中',
  description = '新着店舗やアップデート情報をお届けしています。',
  className,
}: FollowXCardProps) => (
  <a
    href={SITE.social.x}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="FINDE公式Xをフォローする"
    className={cn(
      'group flex items-center gap-4 border border-border bg-white px-5 py-4 transition-colors hover:border-foreground/30 hover:bg-muted/40',
      className,
    )}
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary">
      <XLogo className="h-4 w-4 text-white" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="font-headline text-[12px] font-black tracking-tight text-foreground">
        {heading}
      </p>
      <p className="mt-0.5 truncate text-[11px] leading-relaxed text-muted-foreground/50">
        {description}
      </p>
    </div>
    <span className="shrink-0 font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 transition-colors group-hover:text-primary">
      Follow →
    </span>
  </a>
)
