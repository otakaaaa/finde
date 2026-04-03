import { useState } from 'react'
import { Link } from 'react-router'
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

const ForgotPasswordPage = () => {
  const { loading, error, sendPasswordReset } = useAuthActions()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await sendPasswordReset(email)
    if (success) {
      setSent(true)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:w-[42%] lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px)',
          }}
        />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 18% 24%, rgba(255,255,255,0.12) 0, transparent 28%), linear-gradient(160deg, transparent 54%, rgba(255,255,255,0.05) 54%, rgba(255,255,255,0.05) 57%, transparent 57%)',
          }}
        />

        <div className="pointer-events-none absolute -bottom-8 -left-6 select-none">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.05]"
            style={{ fontSize: 'clamp(120px, 20vw, 260px)' }}
          >
            RESET
          </span>
        </div>

        <div className="relative">
          <p className="font-headline text-[9px] font-black uppercase tracking-[0.6em] text-white/30">
            fukunavi
          </p>
        </div>

        <div className="relative">
          <div className="mb-6 h-px w-10 bg-white/20" />
          <h2 className="mb-5 font-headline text-[52px] font-black leading-[0.88] tracking-tighter text-white">
            RESET<br />YOUR<br />ACCESS.
          </h2>
          <p className="max-w-[240px] text-[12px] leading-[1.8] text-white/35">
            登録済みメールへ再設定リンクを送ります。
          </p>
        </div>

        <div className="relative flex items-center gap-3">
          <span className="h-[2px] w-6 bg-white/25" />
          <span className="font-headline text-[8px] font-black uppercase tracking-[0.5em] text-white/20">
            Forgot Password
          </span>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-white px-8 py-12 sm:px-12 md:px-16 lg:px-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/5 to-transparent" />

        <div className="mb-10 lg:hidden">
          <p className="mb-1 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/35">
            fukunavi
          </p>
          <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground">
            RESET
          </h1>
        </div>

        <div className="relative mx-auto w-full max-w-[380px]">
          <div className="mb-8 hidden lg:block">
            <p className="mb-1 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/35">
              アカウント復旧
            </p>
            <h1 className="font-headline text-2xl font-black tracking-tight text-foreground">
              パスワード再設定
            </h1>
          </div>

          <div className="wish-card-enter mb-8 border-l-[3px] border-l-border bg-muted/35 px-4 py-4">
            <p className="font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/40">
              Password Reset
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-foreground/70">
              登録済みのメールアドレスを入力すると、パスワード再設定用のリンクを送信します。
            </p>
          </div>

          {sent ? (
            <>
              <div className="wish-card-enter mb-6 border-l-[3px] border-l-emerald-400 bg-emerald-50 px-4 py-4">
                <p className="font-headline text-[9px] font-black uppercase tracking-[0.35em] text-emerald-600/80">
                  Link Sent
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-emerald-800">
                  {email} にパスワードリセット用のリンクを送信しました。メールをご確認ください。
                </p>
              </div>

              <div className="wish-card-enter space-y-3" style={{ animationDelay: '40ms' }}>
                <Link
                  to="/auth/login"
                  className="flex w-full items-center justify-center bg-primary py-4 font-headline text-[10px] font-black uppercase tracking-[0.4em] text-white transition-opacity hover:opacity-85"
                >
                  ログインへ戻る
                </Link>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="w-full border border-border py-3 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60 transition-colors hover:border-foreground/25 hover:bg-muted/50"
                >
                  再送する
                </button>
              </div>
            </>
          ) : (
            <>
              {error && (
                <div className="wish-card-enter mb-6 border-l-[3px] border-l-red-400 bg-red-50 px-4 py-3">
                  <p className="text-[11px] font-medium text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <LineField
                  label="メールアドレス"
                  fieldId="email"
                  type="email"
                  placeholder="example@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  animDelay={0}
                />

                <div className="wish-card-enter pt-2" style={{ animationDelay: '40ms' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary py-4 font-headline text-[10px] font-black uppercase tracking-[0.4em] text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                  >
                    {loading ? '送信中…' : 'リセットリンクを送信'}
                  </button>
                </div>
              </form>
            </>
          )}

          <p
            className="wish-card-enter mt-8 text-center font-headline text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/35"
            style={{ animationDelay: '80ms' }}
          >
            ログイン画面へ{' '}
            <Link
              to="/auth/login"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              戻る
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
