import { Link } from 'react-router'
import { Heart, List, LogOut, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthActions } from '@/hooks/useAuthActions'

const MyPage = () => {
  const { user } = useAuth()
  const { signOut, loading } = useAuthActions()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">マイページ</h1>

      {/* Profile */}
      <div className="mb-6 flex items-center gap-4 rounded-lg border p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
          {user?.displayName?.[0] ?? '?'}
        </div>
        <div>
          <p className="font-semibold">{user?.displayName ?? '名前未設定'}</p>
          <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="space-y-2">
        <Link
          to="/mypage/favorites"
          className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
        >
          <Heart className="h-5 w-5 text-muted-foreground" />
          <span>お気に入り</span>
        </Link>

        <Link
          to="/wishes"
          className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
        >
          <List className="h-5 w-5 text-muted-foreground" />
          <span>ウィッシュリスト</span>
        </Link>

        <Link
          to="/listing-request"
          className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
        >
          <User className="h-5 w-5 text-muted-foreground" />
          <span>店舗の掲載申請</span>
        </Link>

        <button
          onClick={signOut}
          disabled={loading}
          className="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted disabled:opacity-50"
        >
          <LogOut className="h-5 w-5 text-muted-foreground" />
          <span>ログアウト</span>
        </button>
      </nav>
    </div>
  )
}

export default MyPage
