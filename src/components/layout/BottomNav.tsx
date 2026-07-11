import { Link, useLocation } from 'react-router'
import { Home, Search, PlusSquare, Clapperboard, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface TabItem {
  to: string
  label: string
  icon: typeof Home
  /** パス前方一致でアクティブ判定するか（false は完全一致） */
  prefix?: boolean
}

/**
 * Instagram風のモバイル用ボトムタブバー。
 * デスクトップ（md以上）では非表示（ヘッダーナビを使用）。
 */
export const BottomNav = () => {
  const location = useLocation()
  const { user } = useAuth()

  const items: TabItem[] = [
    { to: '/', label: 'ホーム', icon: Home },
    { to: '/shops', label: '店舗を探す', icon: Search, prefix: true },
    { to: user ? '/share/new' : '/auth/login', label: '投稿', icon: PlusSquare },
    { to: '/share', label: 'シャレ活', icon: Clapperboard, prefix: true },
    { to: user ? '/mypage' : '/auth/login', label: 'マイページ', icon: User, prefix: true },
  ]

  const isActive = (item: TabItem): boolean =>
    item.prefix && item.to !== '/'
      ? location.pathname.startsWith(item.to)
      : location.pathname === item.to

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex h-12 items-center justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="メインナビゲーション"
    >
      {items.map((item) => {
        const Icon = item.icon
        const active = isActive(item)
        return (
          <Link
            key={item.label}
            to={item.to}
            aria-label={item.label}
            className="flex h-full flex-1 items-center justify-center"
          >
            <Icon
              className={cn(
                'h-6 w-6 transition-colors',
                active ? 'text-foreground' : 'text-foreground/60',
              )}
              strokeWidth={active ? 2.5 : 1.8}
            />
          </Link>
        )
      })}
    </nav>
  )
}
