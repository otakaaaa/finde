import { Link, useLocation } from 'react-router'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/mypage/share', label: '公開投稿' },
  { to: '/mypage/share/drafts', label: '下書き' },
  { to: '/mypage/share/bookmarks', label: 'ブックマーク' },
]

export const ShareMypageNav = () => {
  const { pathname } = useLocation()

  return (
    <div className="mb-6 flex gap-1 border-b border-border">
      {LINKS.map((link) => {
        const active = pathname === link.to
        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              'border-b-2 px-4 py-2.5 font-headline text-[11px] font-black uppercase tracking-[0.2em] transition-colors',
              active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground/40 hover:text-muted-foreground/70',
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </div>
  )
}
