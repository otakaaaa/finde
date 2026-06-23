import { Link } from 'react-router'
import { useAuthActions } from '@/hooks/useAuthActions'
import { GoogleLogo } from '@/components/icons/GoogleLogo'
import { XLogo } from '@/components/icons/XLogo'

const LoginPage = () => {
  const { loading, error, signInWithGoogle, signInWithTwitter } = useAuthActions()

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

        <div className="pointer-events-none absolute -bottom-4 -left-4 select-none">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.05]"
            style={{ fontSize: 'clamp(120px, 20vw, 260px)' }}
          >
            IN
          </span>
        </div>

        <div className="relative">
          <p className="font-headline text-[9px] font-black uppercase tracking-[0.6em] text-white/30">
            FINDE
          </p>
        </div>

        <div className="relative">
          <div className="mb-6 h-px w-10 bg-white/20" />
          <h2 className="mb-5 font-headline text-[52px] font-black leading-[0.88] tracking-tighter text-white">
            WELCOME<br />BACK.
          </h2>
          <p className="max-w-[200px] text-[12px] leading-[1.8] text-white/35">
            お気に入りの古着屋を<br />見つけよう。
          </p>
        </div>

        <div className="relative flex items-center gap-3">
          <span className="h-[2px] w-6 bg-white/25" />
          <span className="font-headline text-[8px] font-black uppercase tracking-[0.5em] text-white/20">
            Login
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
            LOGIN
          </h1>
        </div>

        <div className="mx-auto w-full max-w-[360px]">

          <div className="mb-10 hidden lg:block">
            <p className="mb-1 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/35">
              ようこそ
            </p>
            <h1 className="font-headline text-2xl font-black tracking-tight text-foreground">
              ログイン
            </h1>
          </div>

          {error && (
            <div className="wish-card-enter mb-6 border-l-[3px] border-l-red-400 bg-red-50 px-4 py-3">
              <p className="text-[11px] font-medium text-red-700">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="wish-card-enter flex w-full items-center justify-center gap-2.5 border border-border py-3 font-headline text-[10px] font-black uppercase tracking-[0.25em] text-foreground/60 transition-all hover:border-foreground/25 hover:bg-muted/50 disabled:opacity-50"
          >
            <GoogleLogo className="h-4 w-4" />
            Google でログイン
          </button>

          <button
            type="button"
            onClick={signInWithTwitter}
            disabled={loading}
            className="wish-card-enter mt-3 flex w-full items-center justify-center gap-2.5 border border-border bg-black py-3 font-headline text-[10px] font-black uppercase tracking-[0.25em] text-white transition-all hover:bg-black/85 disabled:opacity-50"
          >
            <XLogo className="h-3.5 w-3.5" />
            X でログイン
          </button>

          <p className="wish-card-enter mt-8 text-center font-headline text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/35">
            初めての方は{' '}
            <Link
              to="/auth/register"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
