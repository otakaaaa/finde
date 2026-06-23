import { useState } from 'react'
import { Link } from 'react-router'
import { useAuthActions } from '@/hooks/useAuthActions'
import { GoogleLogo } from '@/components/icons/GoogleLogo'
import { XLogo } from '@/components/icons/XLogo'

const RegisterPage = () => {
  const { loading, error, signInWithGoogle, signInWithTwitter } = useAuthActions()
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)

  const canSubmit = agreedToTerms && agreedToPrivacy
  const [showAgreementError, setShowAgreementError] = useState(false)

  const handleSignIn = (provider: 'google' | 'twitter') => {
    if (!canSubmit) {
      setShowAgreementError(true)
      return
    }
    if (provider === 'google') {
      signInWithGoogle()
    } else {
      signInWithTwitter()
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">

      {/* ── Left decorative panel ─────────────────── */}
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:w-[42%] lg:flex-col lg:justify-between lg:p-12">

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px)',
          }}
        />

        <div className="pointer-events-none absolute -bottom-8 -left-6 select-none">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.05]"
            style={{ fontSize: 'clamp(120px, 20vw, 260px)' }}
          >
            UP
          </span>
        </div>

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, transparent 49.8%, rgba(255,255,255,0.04) 49.8%, rgba(255,255,255,0.04) 50.2%, transparent 50.2%)',
          }}
        />

        <div className="relative">
          <p className="font-headline text-[9px] font-black uppercase tracking-[0.6em] text-white/30">
            FINDE
          </p>
        </div>

        <div className="relative">
          <div className="mb-6 h-px w-10 bg-white/20" />
          <h2 className="mb-5 font-headline text-[52px] font-black leading-[0.88] tracking-tighter text-white">
            START<br />YOUR<br />JOURNEY.
          </h2>
          <p className="max-w-[200px] text-[12px] leading-[1.8] text-white/35">
            アカウントを作成して<br />理想の一着を探そう。
          </p>
        </div>

        <div className="relative flex items-center gap-3">
          <span className="h-[2px] w-6 bg-white/25" />
          <span className="font-headline text-[8px] font-black uppercase tracking-[0.5em] text-white/20">
            Register
          </span>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────── */}
      <div className="flex flex-1 flex-col justify-center bg-white px-8 py-12 sm:px-12 md:px-16 lg:px-20">

        <div className="mb-10 lg:hidden">
          <p className="mb-1 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/35">
            FINDE
          </p>
          <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground">
            REGISTER
          </h1>
        </div>

        <div className="mx-auto w-full max-w-[360px]">

          <div className="mb-10 hidden lg:block">
            <p className="mb-1 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/35">
              アカウント作成
            </p>
            <h1 className="font-headline text-2xl font-black tracking-tight text-foreground">
              新規登録
            </h1>
          </div>

          {error && (
            <div className="wish-card-enter mb-6 border-l-[3px] border-l-red-400 bg-red-50 px-4 py-3">
              <p className="text-[11px] font-medium text-red-700">{error}</p>
            </div>
          )}

          {showAgreementError && !canSubmit && (
            <div className="wish-card-enter mb-4 border-l-[3px] border-l-amber-400 bg-amber-50 px-4 py-3">
              <p className="text-[11px] font-medium text-amber-700">
                利用規約とプライバシーポリシーへの同意が必要です
              </p>
            </div>
          )}

          <div className="wish-card-enter mb-6 space-y-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => { setAgreedToTerms(e.target.checked); setShowAgreementError(false) }}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
              />
              <span className="text-[11px] leading-relaxed text-muted-foreground">
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                >
                  利用規約
                </Link>
                に同意します
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={agreedToPrivacy}
                onChange={(e) => { setAgreedToPrivacy(e.target.checked); setShowAgreementError(false) }}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
              />
              <span className="text-[11px] leading-relaxed text-muted-foreground">
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                >
                  プライバシーポリシー
                </Link>
                に同意します
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => handleSignIn('google')}
            disabled={loading}
            className="wish-card-enter flex w-full items-center justify-center gap-2.5 border border-border py-3 font-headline text-[10px] font-black uppercase tracking-[0.25em] text-foreground/60 transition-all hover:border-foreground/25 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GoogleLogo className="h-4 w-4" />
            Google で登録
          </button>

          <button
            type="button"
            onClick={() => handleSignIn('twitter')}
            disabled={loading}
            className="wish-card-enter mt-3 flex w-full items-center justify-center gap-2.5 border border-border bg-black py-3 font-headline text-[10px] font-black uppercase tracking-[0.25em] text-white transition-all hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XLogo className="h-3.5 w-3.5" />
            X で登録
          </button>

          <p className="wish-card-enter mt-8 text-center font-headline text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/35">
            すでにアカウントをお持ちの方は{' '}
            <Link
              to="/auth/login"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
