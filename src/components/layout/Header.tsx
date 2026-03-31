import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useAuthActions } from '@/hooks/useAuthActions'
import { cn } from '@/lib/utils'

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
  { to: '/wishes', label: 'WISHES', labelJa: 'ウィッシュ' },
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
  const { user } = useAuth()
  const { signOut } = useAuthActions()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

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
            className="group flex items-center gap-2.5 select-none"
          >
            {/* Mark */}
            <span className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center bg-primary',
              'font-headline text-[15px] font-black leading-none text-white',
              'transition-transform duration-200 group-hover:scale-95',
            )}>
              服
            </span>
            {/* Wordmark */}
            <span className="flex flex-col leading-none">
              <span className="font-headline text-[13px] font-black tracking-[0.15em] text-foreground">
                FUKUNAVI
              </span>
              <span className="font-headline text-[8px] font-bold tracking-[0.4em] text-muted-foreground/40">
                フクナビ
              </span>
            </span>
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
            {user?.role === 'shop_owner' && (
              <NavLink item={{ to: '/owner/dashboard', label: 'OWNER' }} />
            )}

            {/* Divider */}
            <span className="h-4 w-px bg-border" />

            {/* Auth area */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 overflow-hidden rounded-full bg-primary font-headline text-[10px] font-black text-white">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName ?? ''} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">{userInitial}</span>
                  )}
                </div>
                <button
                  onClick={signOut}
                  className={cn(
                    'font-headline text-[10px] font-black uppercase tracking-[0.25em]',
                    'text-muted-foreground/50 transition-colors hover:text-foreground',
                  )}
                >
                  Sign Out
                </button>
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
              <div className="flex h-7 w-7 shrink-0 overflow-hidden rounded-full bg-primary font-headline text-[10px] font-black text-white">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName ?? ''} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">{userInitial}</span>
                )}
              </div>
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
          'fixed inset-0 z-40 flex flex-col bg-background transition-all duration-300 md:hidden',
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
            ...(user?.role === 'shop_owner' ? [{ to: '/owner/dashboard', label: 'OWNER' }] : []),
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
                onClick={signOut}
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
