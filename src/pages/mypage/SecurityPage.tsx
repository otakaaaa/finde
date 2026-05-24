import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ShieldCheck, ShieldOff, Smartphone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type EnrollStep = 'idle' | 'scanning' | 'verifying' | 'success'

interface TotpFactor {
  id: string
  status: 'verified' | 'unverified'
  createdAt: string
}

interface EnrollData {
  factorId: string
  qrCode: string
  secret: string
}

const SecurityPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [factors, setFactors] = useState<TotpFactor[]>([])
  const [step, setStep] = useState<EnrollStep>('idle')
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)

  const fetchFactors = async () => {
    setLoading(true)
    const { data } = await supabase.auth.mfa.listFactors()
    setFactors(
      (data?.totp ?? []).map((f) => ({
        id: f.id,
        status: f.status as TotpFactor['status'],
        createdAt: f.created_at,
      }))
    )
    setLoading(false)
  }

  useEffect(() => {
    fetchFactors()
  }, [])

  const verifiedFactor = factors.find((f) => f.status === 'verified')
  const isEnabled = !!verifiedFactor

  const handleStartEnroll = async () => {
    setActionLoading(true)
    setError(null)

    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'finde',
        friendlyName: 'Authenticator App',
      })

      if (enrollError || !data) {
        setError('登録の開始に失敗しました。再度お試しください。')
        return
      }

      setEnrollData({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      })
      setStep('scanning')
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerifyEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollData || verifyCode.length !== 6) return

    setActionLoading(true)
    setError(null)

    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollData.factorId,
        code: verifyCode,
      })

      if (verifyError) {
        setError('コードが正しくありません。再度お試しください。')
        setVerifyCode('')
        return
      }

      setStep('success')
      await fetchFactors()
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!verifiedFactor) return

    setActionLoading(true)
    setError(null)

    try {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: verifiedFactor.id,
      })

      if (unenrollError) {
        setError('無効化に失敗しました。再度お試しください。')
        return
      }

      setShowDisableConfirm(false)
      setStep('idle')
      await fetchFactors()
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelEnroll = async () => {
    // 未完了の登録を削除
    if (enrollData) {
      await supabase.auth.mfa.unenroll({ factorId: enrollData.factorId })
    }
    setEnrollData(null)
    setVerifyCode('')
    setError(null)
    setStep('idle')
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="bg-background">
      {/* ── Header ───────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-10 pt-10 md:px-16">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-end select-none overflow-hidden pr-4 md:pr-10">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(120px, 22vw, 240px)' }}
          >
            2FA
          </span>
        </div>

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-1.5 border border-white/10 px-3 py-1">
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.5em] text-white/40">
              Security
            </span>
          </div>

          <div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.4em] text-white/30">
              — Settings
            </p>
            <h1 className="font-headline text-2xl font-black leading-none tracking-tight text-white md:text-3xl">
              セキュリティ設定
            </h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 md:px-16">

        {/* ── MFA status card ──────────────────────── */}
        <div className="mb-8 wish-card-enter">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
              二段階認証
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Status banner */}
          <div className={cn(
            'mb-6 flex items-center gap-4 border px-5 py-4',
            isEnabled
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-border bg-muted/30',
          )}>
            <div className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-sm',
              isEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground/40',
            )}>
              {isEnabled
                ? <ShieldCheck className="h-5 w-5" />
                : <ShieldOff className="h-5 w-5" />
              }
            </div>
            <div className="flex-1">
              <p className="font-headline text-[12px] font-black uppercase tracking-[0.15em] text-foreground/80">
                {isEnabled ? '二段階認証 — 有効' : '二段階認証 — 無効'}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                {isEnabled
                  ? '認証アプリによる TOTP が設定されています'
                  : 'ログイン時に追加の確認なし'
                }
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 border-l-[3px] border-l-red-400 bg-red-50 px-4 py-3">
              <p className="text-[11px] font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* ── Idle: not enabled ─────────────────── */}
          {step === 'idle' && !isEnabled && (
            <div>
              <p className="mb-6 text-[12px] leading-[1.9] text-muted-foreground/60">
                Google Authenticator や Authy などの認証アプリを使って、ログイン時に 6 桁のコードによる二段階認証を有効にできます。
              </p>
              <button
                type="button"
                onClick={handleStartEnroll}
                disabled={actionLoading}
                className="flex items-center gap-2 bg-primary px-6 py-3 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                <Smartphone className="h-3.5 w-3.5" />
                二段階認証を有効にする
              </button>
            </div>
          )}

          {/* ── Idle: already enabled ─────────────── */}
          {step === 'idle' && isEnabled && (
            <div>
              {!showDisableConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDisableConfirm(true)}
                  className="font-headline text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 underline underline-offset-4 transition-colors hover:text-red-500"
                >
                  無効にする
                </button>
              ) : (
                <div className="border border-red-200 bg-red-50 p-5">
                  <p className="mb-4 text-[12px] font-medium leading-[1.8] text-red-700">
                    二段階認証を無効にすると、ログイン時の追加確認がなくなります。本当に無効にしますか？
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleDisable}
                      disabled={actionLoading}
                      className="bg-red-500 px-5 py-2.5 font-headline text-[10px] font-black uppercase tracking-[0.25em] text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                    >
                      {actionLoading ? '処理中…' : '無効にする'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDisableConfirm(false)}
                      disabled={actionLoading}
                      className="border border-border px-5 py-2.5 font-headline text-[10px] font-black uppercase tracking-[0.25em] text-foreground/60 transition-colors hover:border-foreground/30 disabled:opacity-50"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Scanning: QR code display ─────────── */}
          {step === 'scanning' && enrollData && (
            <div>
              <div className="mb-6">
                <p className="mb-4 text-[12px] leading-[1.9] text-muted-foreground/60">
                  <strong className="text-foreground/70">Step 1:</strong>{' '}
                  認証アプリ（Google Authenticator・Authy など）を開き、QR コードをスキャンしてください。
                </p>
                <div className="inline-block border border-border bg-white p-4">
                  <img
                    src={enrollData.qrCode}
                    alt="2FA QR Code"
                    className="h-40 w-40"
                  />
                </div>
              </div>

              <div className="mb-6">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">
                  QR コードが読み取れない場合は手動入力
                </p>
                <code className="block rounded bg-muted px-3 py-2 font-mono text-[11px] tracking-wider text-foreground/70 break-all">
                  {enrollData.secret}
                </code>
              </div>

              <p className="mb-4 text-[12px] leading-[1.9] text-muted-foreground/60">
                <strong className="text-foreground/70">Step 2:</strong>{' '}
                アプリに表示された 6 桁のコードを入力して確認してください。
              </p>

              <form onSubmit={handleVerifyEnroll} className="space-y-6">
                <div>
                  <label
                    htmlFor="verify-code"
                    className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/45"
                  >
                    認証コード
                  </label>
                  <input
                    id="verify-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full border-b border-border bg-transparent pb-2.5 pt-1 text-[22px] font-black tracking-[0.5em] text-foreground placeholder:text-muted-foreground/20 focus:border-foreground focus:outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={actionLoading || verifyCode.length !== 6}
                    className="bg-primary px-6 py-3 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                  >
                    {actionLoading ? '確認中…' : '確認して有効化'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEnroll}
                    disabled={actionLoading}
                    className="border border-border px-5 py-3 font-headline text-[10px] font-black uppercase tracking-[0.25em] text-foreground/60 transition-colors hover:border-foreground/30 disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Success ───────────────────────────── */}
          {step === 'success' && (
            <div className="border-l-[3px] border-l-emerald-400 bg-emerald-50 px-4 py-4">
              <p className="mb-1 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
                有効化しました
              </p>
              <p className="text-[11px] leading-[1.8] text-emerald-600">
                次回のログインから二段階認証が求められます。
              </p>
            </div>
          )}
        </div>

        {/* ── Back link ────────────────────────────── */}
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

export default SecurityPage
