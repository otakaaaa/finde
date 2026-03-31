import { LogOut, X } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuthActions } from '@/hooks/useAuthActions'

export const LogoutConfirmModal = () => {
  const { logoutModalOpen, closeLogoutModal } = useUiStore()
  const { signOut, loading } = useAuthActions()

  if (!logoutModalOpen) return null

  const handleConfirm = async () => {
    await signOut()
    closeLogoutModal()
  }

  return (
    <div
      className="modal-backdrop-enter fixed inset-0 z-[100] flex items-center justify-center bg-foreground/65 px-4 backdrop-blur-[2px]"
      onClick={closeLogoutModal}
    >
      <div
        className="modal-enter relative w-full max-w-[360px] bg-white editorial-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative top bar */}
        <div className="h-[3px] w-full bg-foreground" />

        {/* Header */}
        <div className="px-6 pb-5 pt-6">
          {/* Title */}
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.5em] text-muted-foreground/40">
            — Confirm
          </p>
          <h2 className="font-headline text-2xl font-black leading-none tracking-tight text-foreground">
            SIGN OUT
          </h2>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/60">
            ログアウトしてもよろしいですか？<br />
            再度ご利用の際はログインが必要です。
          </p>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-border" />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4">
          <button
            onClick={closeLogoutModal}
            disabled={loading}
            className="h-9 px-4 font-headline text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 transition-colors hover:text-foreground disabled:opacity-30"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex h-9 items-center gap-2 bg-foreground px-5 font-headline text-[10px] font-black uppercase tracking-wider text-white transition-opacity hover:opacity-75 disabled:opacity-40"
          >
            {loading ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
            ) : (
              <LogOut className="h-3 w-3" />
            )}
            ログアウト
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={closeLogoutModal}
          className="absolute right-4 top-4 text-muted-foreground/25 transition-colors hover:text-muted-foreground"
          aria-label="閉じる"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
