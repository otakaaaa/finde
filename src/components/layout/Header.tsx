import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import { OWNER_FEATURE_ENABLED, WISH_FEATURE_ENABLED } from '@/config/features'
import { NotificationBell } from '@/components/notification/NotificationBell'
import { FindeLogo } from '@/components/icons/FindeLogo'
import { LogOut, User, LayoutDashboard, Store, ShieldCheck } from 'lucide-react'

interface NavItem {
  to: string
  label: string
  labelJa?: string
  exact?: boolean
}

const PUBLIC_NAV: NavItem[] = [
  { to: '/shops', label: 'SHOPS', labelJa: '店舗を探す' },
]

const USER_NAV: NavItem[] = [
  ...(WISH_FEATURE_ENABLED ? [{ to: '/wishes', label: 'WISHES', labelJa: 'ウィッシュ' }] : []),
  { to: '/mypage', label: 'MYPAGE', labelJa: 'マイページ' },
]

const NavLink = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
  const location = useLocation()
  const isActive = item.exact
    ? location.pathname === item.to
    : location.pathname.startsWith(item.to)

  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center gap-0.5',
        'font-headline text-[10px] font-black uppercase tracking-[0.25em]',
        'transition-colors duration-150',
        isActive ? 'text-foreground' : 'text-muted-foreground/60 hover:text-foreground',
      )}
    >
      {item.label}
      {/* Active underline */}
      <span
        className={cn(
          'h-px w-full bg-foreground transition-all duration-200',
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40',
        )}
      />
    </Link>
  )
}

export const Header = () => {
  const { user, session } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { openLogoutModal } = useUiStore()
  const desktopProfileRef = useRef<HTMLDivElement>(null)
  const mobileProfileRef = useRef<HTMLDivElement>(null)

  // Close menus on route change
  useEffect(() => { setMenuOpen(false); setProfileOpen(false) }, [location.pathname])

  // Click-outside to close profile dropdown
  useEffect(() => {
    if (!profileOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      const clickedDesktopProfile = desktopProfileRef.current?.contains(target) ?? false
      const clickedMobileProfile = mobileProfileRef.current?.contains(target) ?? false

      if (!clickedDesktopProfile && !clickedMobileProfile) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileOpen])

  // Body scroll lock when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const userInitial = user?.displayName?.charAt(0).toUpperCase() ?? '?'

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 bg-background/96 backdrop-blur-md transition-shadow duration-200',
          scrolled ? 'shadow-[0_1px_0_0_hsl(var(--border))]' : 'border-b border-border/50',
        )}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">

          {/* ── Logo ─────────────────────────────── */}
          <Link
            to="/"
            className="transition-opacity duration-200 hover:opacity-60"
            aria-label="FINDE トップページ"
          >
            <FindeLogo size="md" />
          </Link>

          {/* ── Desktop Nav ──────────────────────── */}
          <nav className="hidden items-center gap-6 md:flex">
            {PUBLIC_NAV.map((item) => (
              <NavLink key={item.to} item={item} />
            ))}

            {user && USER_NAV.map((item) => (
              <NavLink key={item.to} item={item} />
            ))}

            {user?.role === 'admin' && (
              <NavLink item={{ to: '/admin', label: 'ADMIN', exact: true }} />
            )}
            {OWNER_FEATURE_ENABLED && user?.role === 'shop_owner' && (
              <NavLink item={{ to: '/owner', label: 'OWNER' }} />
            )}

            {/* 通知ベル（ログイン中のみ） */}
            {user && <NotificationBell />}

            {/* Divider */}
            <span className="h-4 w-px bg-border" />

            {/* Auth area */}
            {user ? (
              <div ref={desktopProfileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className={cn(
                    'flex h-7 w-7 shrink-0 overflow-hidden bg-primary font-headline text-[10px] font-black text-white',
                    'ring-offset-background transition-all duration-150',
                    profileOpen ? 'ring-2 ring-primary ring-offset-2' : 'hover:opacity-80',
                  )}
                  aria-label="プロフィールメニュー"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName ?? ''} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">{userInitial}</span>
                  )}
                </button>

                {/* Profile dropdown */}
                <div
                  className={cn(
                    'absolute right-0 top-full z-50 mt-2 w-52 origin-top-right',
                    'border border-border bg-background editorial-shadow',
                    'transition-all duration-150',
                    profileOpen
                      ? 'pointer-events-auto translate-y-0 opacity-100'
                      : 'pointer-events-none -translate-y-1 opacity-0',
                  )}
                >
                  {/* User identity */}
                  <div className="border-b border-border px-4 py-3">
                    <p className="truncate font-headline text-[11px] font-black tracking-tight text-foreground/80">
                      {user.displayName ?? session?.user?.email}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground/40">{session?.user?.email}</p>
                    {user.role && user.role !== 'user' && (
                      <span className="mt-1.5 inline-block rounded-sm bg-primary/10 px-1.5 py-0.5 font-headline text-[8px] font-black uppercase tracking-wider text-primary">
                        {user.role}
                      </span>
                    )}
                  </div>

                  {/* Nav links */}
                  <div className="py-1">
                    <Link
                      to="/mypage"
                      className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-muted"
                    >
                      <User className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                      <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70">
                        マイページ
                      </span>
                    </Link>
                    <Link
                      to="/mypage/contacts"
                      className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-muted"
                    >
                      <LayoutDashboard className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                      <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70">
                        お問い合わせ
                      </span>
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-muted"
                      >
                        <ShieldCheck className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                        <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70">
                          管理画面
                        </span>
                      </Link>
                    )}
                    {OWNER_FEATURE_ENABLED && user.role === 'shop_owner' && (
                      <Link
                        to="/owner"
                        className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-muted"
                      >
                        <Store className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                        <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70">
                          オーナー
                        </span>
                      </Link>
                    )}
                  </div>

                  {/* ログアウト */}
                  <div className="border-t border-border py-1">
                    <button
                      onClick={() => { setProfileOpen(false); openLogoutModal() }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-muted"
                    >
                      <LogOut className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                      <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
                        ログアウト
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/auth/login"
                className={cn(
                  'flex h-8 items-center border border-foreground/20 px-4',
                  'font-headline text-[10px] font-black uppercase tracking-[0.25em] text-foreground/70',
                  'transition-all duration-150 hover:border-foreground hover:text-foreground',
                )}
              >
                Login
              </Link>
            )}
          </nav>

          {/* ── Mobile: right side ───────────────── */}
          <div className="flex items-center gap-3 md:hidden">
            {user && (
              <>
                <div ref={mobileProfileRef} className="relative">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setProfileOpen((v) => !v) }}
                    className={cn(
                      'flex h-7 w-7 shrink-0 overflow-hidden bg-primary font-headline text-[10px] font-black text-white',
                      'ring-offset-background transition-all duration-150',
                      profileOpen ? 'ring-2 ring-primary ring-offset-2' : 'hover:opacity-80',
                    )}
                    aria-label="プロフィールメニュー"
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName ?? ''} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">{userInitial}</span>
                    )}
                  </button>

                  {/* Mobile profile dropdown */}
                  <div
                    className={cn(
                      'absolute right-0 top-full z-50 mt-2 w-52 origin-top-right',
                      'border border-border bg-background editorial-shadow',
                      'transition-all duration-150',
                      profileOpen
                        ? 'pointer-events-auto translate-y-0 opacity-100'
                        : 'pointer-events-none -translate-y-1 opacity-0',
                    )}
                  >
                    <div className="border-b border-border px-4 py-3">
                      <p className="truncate font-headline text-[11px] font-black tracking-tight text-foreground/80">
                        {user.displayName ?? session?.user?.email}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground/40">{session?.user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/mypage" className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-muted">
                        <User className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                        <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70">マイページ</span>
                      </Link>
                      <Link to="/mypage/contacts" className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-muted">
                        <LayoutDashboard className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                        <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70">お問い合わせ</span>
                      </Link>
                    </div>
                    <div className="border-t border-border py-1">
                      <button
                        onClick={() => { setProfileOpen(false); openLogoutModal() }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-muted"
                      >
                        <LogOut className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                        <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">ログアウト</span>
                      </button>
                    </div>
                  </div>
                </div>
                <NotificationBell />
              </>
            )}
            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 flex-col items-center justify-center gap-1.5"
              aria-label="メニューを開く"
            >
              <span
                className={cn(
                  'h-px w-5 bg-foreground transition-all duration-300 origin-center',
                  menuOpen ? 'translate-y-[3.5px] rotate-45' : '',
                )}
              />
              <span
                className={cn(
                  'h-px w-5 bg-foreground transition-all duration-300 origin-center',
                  menuOpen ? '-translate-y-[3.5px] -rotate-45' : '',
                )}
              />
            </button>
          </div>

        </div>
      </header>

      {/* ── Mobile Overlay ────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex flex-col bg-background transition-all duration-300 md:hidden',
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        style={{ top: '56px' }}
      >
        {/* Decorative watermark */}
        <div className="pointer-events-none absolute right-0 top-0 select-none overflow-hidden">
          <span
            className="font-headline font-black leading-none tracking-tighter text-muted/80"
            style={{ fontSize: 'clamp(80px, 30vw, 180px)' }}
          >
            NAV
          </span>
        </div>

        <nav className="relative flex flex-1 flex-col justify-center px-8 pb-16">
          {/* All nav links — large display style */}
          {[
            ...PUBLIC_NAV,
            ...(user ? USER_NAV : []),
            ...(user?.role === 'admin' ? [{ to: '/admin', label: 'ADMIN', exact: true as const }] : []),
            ...(OWNER_FEATURE_ENABLED && user?.role === 'shop_owner' ? [{ to: '/owner', label: 'OWNER' }] : []),
          ].map((item, i) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'group flex items-baseline gap-4 border-b border-border/40 py-5',
                'transition-all duration-150',
                menuOpen ? 'wish-card-enter' : '',
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="w-5 font-headline text-[9px] font-black tabular-nums text-muted-foreground/25">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-headline text-3xl font-black tracking-tight text-foreground/80 transition-colors group-hover:text-foreground">
                {item.label}
              </span>
              {'labelJa' in item && item.labelJa && (
                <span className="text-xs text-muted-foreground/40">{item.labelJa}</span>
              )}
            </Link>
          ))}

          {/* Auth action */}
          <div
            className={cn(
              'mt-8',
              menuOpen ? 'wish-card-enter' : '',
            )}
            style={{ animationDelay: `${([...PUBLIC_NAV, ...(user ? USER_NAV : [])].length + 2) * 40}ms` }}
          >
            {user ? (
              <button
                onClick={openLogoutModal}
                className="font-headline text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 transition-colors hover:text-foreground"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/auth/login"
                className={cn(
                  'inline-flex h-10 items-center border border-foreground/20 px-6',
                  'font-headline text-[11px] font-black uppercase tracking-[0.3em] text-foreground/70',
                  'transition-all hover:border-foreground hover:text-foreground',
                )}
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  )
}
