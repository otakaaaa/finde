import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'
import { OWNER_FEATURE_ENABLED } from '@/config/features'

const ROLE_REDIRECT: Record<UserRole, string> = {
  admin: '/admin',
  shop_owner: OWNER_FEATURE_ENABLED ? '/owner' : '/',
  user: '/',
}

const MfaChallengePage = () => {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

      // すでに AAL2 達成済みならリダイレクト
      if (aalData?.currentLevel === 'aal2') {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single() as { data: { role: string } | null; error: unknown }
          const role = (data?.role ?? 'user') as UserRole
          navigate(ROLE_REDIRECT[role] ?? '/')
          return
        }
      }

      const { data: factorsData } = await supabase.auth.mfa.listFactors()
      const totp = factorsData?.totp?.[0]

      if (!totp) {
        navigate('/auth/login')
        return
      }

      setFactorId(totp.id)
      setInitializing(false)
    }

    init()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!factorId || code.length !== 6) return

    setLoading(true)
    setError(null)

    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      })

      if (verifyError) {
        setError('コードが正しくありません。再度お試しください。')
        setCode('')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        navigate('/auth/login')
        return
      }

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single() as { data: { role: string } | null; error: unknown }

      const role = (data?.role ?? 'user') as UserRole
      localStorage.setItem('pending_login_toast', 'true')
      navigate(ROLE_REDIRECT[role] ?? '/')
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
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

        <div className="pointer-events-none absolute -bottom-4 -left-4 select-none">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.05]"
            style={{ fontSize: 'clamp(120px, 20vw, 260px)' }}
          >
            2FA
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
            TWO<br />FACTOR.
          </h2>
          <p className="max-w-[200px] text-[12px] leading-[1.8] text-white/35">
            認証アプリのコードを<br />入力してください。
          </p>
        </div>

        <div className="relative flex items-center gap-3">
          <span className="h-[2px] w-6 bg-white/25" />
          <span className="font-headline text-[8px] font-black uppercase tracking-[0.5em] text-white/20">
            2FA
          </span>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────── */}
      <div className="flex flex-1 flex-col justify-center bg-white px-8 py-12 sm:px-12 md:px-16 lg:px-20">

        <div className="mb-10 lg:hidden">
          <p className="mb-1 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/35">
            fukunavi
          </p>
          <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground">
            2FA
          </h1>
        </div>

        <div className="mx-auto w-full max-w-[360px]">

          <div className="mb-8 hidden lg:block">
            <p className="mb-1 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/35">
              二段階認証
            </p>
            <h1 className="font-headline text-2xl font-black tracking-tight text-foreground">
              認証コードを入力
            </h1>
          </div>

          <p className="wish-card-enter mb-8 text-[12px] leading-[1.8] text-muted-foreground/60">
            認証アプリ（Google Authenticator など）に表示されている 6 桁のコードを入力してください。
          </p>

          {error && (
            <div className="wish-card-enter mb-6 border-l-[3px] border-l-red-400 bg-red-50 px-4 py-3">
              <p className="text-[11px] font-medium text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="wish-card-enter">
              <label
                htmlFor="totp-code"
                className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/45"
              >
                認証コード
              </label>
              <input
                id="totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={cn(
                  'w-full border-b bg-transparent pb-2.5 pt-1 text-[22px] font-black tracking-[0.5em] text-foreground placeholder:text-muted-foreground/20',
                  'transition-colors duration-200 focus:outline-none',
                  error ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-foreground',
                )}
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-primary py-4 font-headline text-[10px] font-black uppercase tracking-[0.4em] text-white transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {loading ? '確認中…' : '確認する'}
            </button>
          </form>

          <p className="wish-card-enter mt-8 text-center font-headline text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/35">
            別のアカウントで{' '}
            <button
              type="button"
              onClick={() => supabase.auth.signOut().then(() => navigate('/auth/login'))}
              className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              サインアウト
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default MfaChallengePage
