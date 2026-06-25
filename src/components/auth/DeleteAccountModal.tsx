import { useState } from 'react'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

// ── Constants ──────────────────────────────────────────────────

const CONFIRM_PHRASE = '削除する'

const DELETION_ITEMS = [
  'プロフィール・アバター画像',
  'お気に入り店舗リスト',
  'ウィッシュリスト',
  'サブスクリプション情報',
  'お問い合わせ履歴',
]

// ── Component ──────────────────────────────────────────────────

export const DeleteAccountModal = () => {
  const navigate = useNavigate()
  const { deleteAccountModalOpen, closeDeleteAccountModal } = useUiStore()
  const { setUser, setSession } = useAuthStore()

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isConfirmed = input === CONFIRM_PHRASE

  const handleClose = () => {
    if (loading) return
    setInput('')
    setError(null)
    closeDeleteAccountModal()
  }

  const handleDelete = async () => {
    if (!isConfirmed || loading) return

    setLoading(true)
    setError(null)

    const { error: rpcError } = await supabase.rpc('delete_own_account') as unknown as {
      error: { message: string } | null
    }

    if (rpcError) {
      setError('削除に失敗しました。時間をおいて再度お試しください。')
      setLoading(false)
      return
    }

    // ローカル状態をクリアしてホームへ
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    closeDeleteAccountModal()
    navigate('/')
  }

  if (!deleteAccountModalOpen) return null

  return (
    <div
      className="modal-backdrop-enter fixed inset-0 z-[100] flex items-center justify-center bg-foreground/80 px-4 backdrop-blur-[3px]"
      onClick={handleClose}
    >
      <div
        className="modal-enter relative w-full max-w-[420px] bg-white editorial-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Danger top bar ── */}
        <div className="h-[3px] w-full bg-red-500" />

        {/* ── Header ── */}
        <div className="px-6 pb-5 pt-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="mb-0.5 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-red-400">
                — Danger Zone
              </p>
              <h2 className="font-headline text-2xl font-black leading-none tracking-tight text-foreground">
                アカウント削除
              </h2>
            </div>
          </div>

          <div className="border-l-[3px] border-l-red-400 bg-red-50 px-4 py-3">
            <p className="text-[11px] font-bold leading-relaxed text-red-700">
              この操作は取り消せません。<br/>
              削除後のデータ復元は一切できません。
            </p>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="mx-6 h-px bg-border" />

        {/* ── Deletion list ── */}
        <div className="px-6 py-5">
          <p className="mb-3 font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/40">
            削除されるデータ
          </p>
          <ul className="space-y-2">
            {DELETION_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="h-1 w-1 shrink-0 rounded-full bg-red-400" />
                <span className="text-[11px] text-foreground/60">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Divider ── */}
        <div className="mx-6 h-px bg-border" />

        {/* ── Confirmation input ── */}
        <div className="px-6 py-5">
          <label className="mb-2 block">
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/50">
              確認のため
            </span>
            <span className="mx-1.5 font-headline text-[11px] font-black tracking-wide text-foreground/80">
              「{CONFIRM_PHRASE}」
            </span>
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/50">
              と入力してください
            </span>
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            autoComplete="off"
            placeholder={CONFIRM_PHRASE}
            className={cn(
              'w-full border-b bg-transparent pb-2.5 pt-1 text-[14px] text-foreground placeholder:text-muted-foreground/20',
              'transition-colors duration-200 focus:outline-none disabled:opacity-40',
              isConfirmed
                ? 'border-red-400 focus:border-red-500'
                : 'border-border focus:border-muted-foreground/40',
            )}
          />
          {error && (
            <p className="mt-2 text-[10px] text-red-500">{error}</p>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            onClick={handleClose}
            disabled={loading}
            className="h-9 px-4 font-headline text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 transition-colors hover:text-foreground disabled:opacity-30"
          >
            キャンセル
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
            className={cn(
              'flex h-9 items-center gap-2 px-5 font-headline text-[10px] font-black uppercase tracking-wider text-white transition-all',
              isConfirmed
                ? 'bg-red-500 hover:bg-red-600'
                : 'cursor-not-allowed bg-muted text-muted-foreground/40',
            )}
          >
            {loading ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            アカウントを削除
          </button>
        </div>

        {/* ── Close button ── */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute right-4 top-4 text-muted-foreground/25 transition-colors hover:text-muted-foreground disabled:opacity-30"
          aria-label="閉じる"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
