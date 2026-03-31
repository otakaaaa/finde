import { Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useAuthActions } from '@/hooks/useAuthActions'

export const Header = () => {
  const { user } = useAuth()
  const { signOut } = useAuthActions()

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-black text-white leading-none select-none">
            服
          </span>
          <span className="text-xl font-black tracking-tight text-foreground">
            フクナビ
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link to="/shops" className="text-muted-foreground hover:text-foreground">
            店舗を探す
          </Link>
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                  管理
                </Link>
              )}
              {user.role === 'shop_owner' && (
                <Link to="/owner/dashboard" className="text-muted-foreground hover:text-foreground">
                  店舗管理
                </Link>
              )}
              <Link to="/wishes" className="text-muted-foreground hover:text-foreground">
                ウィッシュ
              </Link>
              <Link to="/mypage" className="text-muted-foreground hover:text-foreground">
                マイページ
              </Link>
              <button
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              to="/auth/login"
              className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
            >
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
