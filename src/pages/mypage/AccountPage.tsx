import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useAuthActions } from '@/hooks/useAuthActions'
import { cn } from '@/lib/utils'

interface LineFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  fieldId: string
  error?: string
  animDelay?: number
}

const LineField = ({ label, fieldId, error, animDelay = 0, ...props }: LineFieldProps) => (
  <div className="wish-card-enter" style={{ animationDelay: `${animDelay}ms` }}>
    <label
      htmlFor={fieldId}
      className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/45"
    >
      {label}
    </label>
    <input
      id={fieldId}
      className={cn(
        'w-full border-b bg-transparent pb-2.5 pt-1 text-[14px] text-foreground placeholder:text-muted-foreground/25',
        'transition-colors duration-200 focus:outline-none',
        error ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-foreground',
      )}
      {...props}
    />
    {error && (
      <p className="mt-1.5 text-[10px] text-red-500">{error}</p>
    )}
  </div>
)

const AccountPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    loading,
    error,
    clearError,
    hasPasswordIdentity,
    updateEmail,
    updatePasswordWithCurrent,
  } = useAuthActions()

  const [currentEmail, setCurrentEmail] = useState('')
  const [hasPassword, setHasPassword] = useState(true)

  const emailChanged = searchParams.get('email_changed') === 'true'
  const emailChangeError = searchParams.get('email_change_error') === 'true'

  const [newEmail, setNewEmail] = useState('')
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [passwordValidationError, setPasswordValidationError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentEmail(user?.email ?? '')
      const hasPw = await hasPasswordIdentity()
      setHasPassword(hasPw)
    }
    load()
  // hasPasswordIdentity は毎レンダリングで同一参照にならないため初回のみ実行
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailValidationError(null)
    setEmailSuccess(false)
    clearError()

    if (!newEmail.includes('@')) {
      setEmailValidationError('有効なメールアドレスを入力してください')
      return
    }
    if (newEmail === currentEmail) {
      setEmailValidationError('現在と同じメールアドレスです')
      return
    }

    const ok = await updateEmail(newEmail)
    if (ok) {
      setEmailSuccess(true)
      setNewEmail('')
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordValidationError(null)
    setPasswordSuccess(false)
    clearError()

    if (newPassword.length < 8) {
      setPasswordValidationError('新しいパスワードは8文字以上で入力してください')
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordValidationError('新しいパスワードが一致しません')
      return
    }

    const ok = await updatePasswordWithCurrent(currentPassword, newPassword)
    if (ok) {
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
    }
  }

  return (
    <div className="bg-background">
      {/* ── Header ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-10 pt-10 md:px-16">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-end select-none overflow-hidden pr-4 md:pr-10">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(120px, 22vw, 240px)' }}
          >
            ID
          </span>
        </div>

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-1.5 border border-white/10 px-3 py-1">
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.5em] text-white/40">
              Account
            </span>
          </div>

          <div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.4em] text-white/30">
              — Settings
            </p>
            <h1 className="font-headline text-2xl font-black leading-none tracking-tight text-white md:text-3xl">
              アカウント設定
            </h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 md:px-16">

        {/* ── Email change section ────────────── */}
        <div className="mb-10 wish-card-enter">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
              メールアドレス
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {emailChanged && (
            <div className="mb-6 border-l-[3px] border-l-emerald-400 bg-emerald-50 px-4 py-4">
              <p className="mb-1 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
                メールアドレスを変更しました
              </p>
              <p className="text-[11px] leading-[1.8] text-emerald-600">
                新しいメールアドレスへの変更が完了しました。
              </p>
            </div>
          )}

          {emailChangeError && (
            <div className="mb-6 border-l-[3px] border-l-red-400 bg-red-50 px-4 py-3">
              <p className="text-[11px] font-medium text-red-700">
                確認リンクが無効または期限切れです。もう一度メールアドレスの変更をお試しください。
              </p>
            </div>
          )}

          <div className="mb-5 border border-border bg-muted/30 px-5 py-4">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
              現在のメールアドレス
            </p>
            <p className="mt-1.5 text-[14px] text-foreground/70">{currentEmail || '—'}</p>
          </div>

          {!hasPassword ? (
            <div className="border border-border bg-muted/30 px-5 py-5">
              <p className="text-[12px] leading-[1.8] text-muted-foreground/60">
                Google アカウントでログインしているため、メールアドレスの変更は{' '}
                <a
                  href="https://myaccount.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-foreground/80"
                >
                  Google アカウント設定
                </a>
                {' '}から行ってください。
              </p>
            </div>
          ) : (
            <>
              {emailSuccess && (
                <div className="mb-6 border-l-[3px] border-l-emerald-400 bg-emerald-50 px-4 py-4">
                  <p className="mb-1 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
                    確認メールを送信しました
                  </p>
                  <p className="text-[11px] leading-[1.8] text-emerald-600">
                    新しいメールアドレス宛に確認リンクを送りました。リンクをクリックすると変更が完了します。
                  </p>
                </div>
              )}

              {error && !passwordSuccess && (
                <div className="mb-6 border-l-[3px] border-l-red-400 bg-red-50 px-4 py-3">
                  <p className="text-[11px] font-medium text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <LineField
                  label="新しいメールアドレス"
                  fieldId="new-email"
                  type="email"
                  placeholder="new@example.com"
                  autoComplete="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  error={emailValidationError ?? undefined}
                  required
                  animDelay={0}
                />

                <div className="wish-card-enter pt-2" style={{ animationDelay: '40ms' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary px-6 py-3 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                  >
                    {loading ? '送信中…' : '確認メールを送信'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* ── Password change section ─────────── */}
        <div className="mb-10 wish-card-enter">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
              パスワード
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {!hasPassword ? (
            <div className="border border-border bg-muted/30 px-5 py-5">
              <p className="text-[12px] leading-[1.8] text-muted-foreground/60">
                Google アカウントでログインしているため、パスワードは設定されていません。
              </p>
            </div>
          ) : (
            <>
              {passwordSuccess && (
                <div className="mb-6 border-l-[3px] border-l-emerald-400 bg-emerald-50 px-4 py-4">
                  <p className="mb-1 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
                    パスワードを変更しました
                  </p>
                  <p className="text-[11px] leading-[1.8] text-emerald-600">
                    新しいパスワードで次回ログインしてください。
                  </p>
                </div>
              )}

              {error && !emailSuccess && (
                <div className="mb-6 border-l-[3px] border-l-red-400 bg-red-50 px-4 py-3">
                  <p className="text-[11px] font-medium text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <LineField
                  label="現在のパスワード"
                  fieldId="current-password"
                  type="password"
                  placeholder="現在のパスワード"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  animDelay={0}
                />
                <LineField
                  label="新しいパスワード"
                  fieldId="new-password"
                  type="password"
                  placeholder="英数字 8文字以上"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  error={
                    passwordValidationError === '新しいパスワードは8文字以上で入力してください'
                      ? passwordValidationError
                      : undefined
                  }
                  required
                  animDelay={40}
                />
                <LineField
                  label="新しいパスワード（確認）"
                  fieldId="new-password-confirm"
                  type="password"
                  placeholder="パスワードを再入力"
                  autoComplete="new-password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  error={
                    passwordValidationError === '新しいパスワードが一致しません'
                      ? passwordValidationError
                      : undefined
                  }
                  required
                  animDelay={80}
                />

                <div className="wish-card-enter pt-2" style={{ animationDelay: '120ms' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary px-6 py-3 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                  >
                    {loading ? '更新中…' : 'パスワードを変更'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* ── Back link ────────────────────────── */}
        <button
          type="button"
          onClick={() => navigate('/mypage')}
          className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/35 transition-colors hover:text-foreground/60"
        >
          ← マイページへ戻る
        </button>
      </div>
    </div>
  )
}

export default AccountPage
