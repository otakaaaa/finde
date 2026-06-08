import { useState, useRef } from 'react'
import { Link } from 'react-router'
import { useAuthActions } from '@/hooks/useAuthActions'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const DIGITS = 6

const VerifyEmailPage = () => {
  const storedEmail = localStorage.getItem('pending_confirmation_email') ?? ''
  const [digits, setDigits] = useState<string[]>(Array(DIGITS).fill(''))
  const [resendState, setResendState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { loading, error, verifyEmailOtp } = useAuthActions()

  const token = digits.join('')

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    if (digit && index < DIGITS - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGITS)
    const next = Array(DIGITS).fill('')
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    const focusIndex = Math.min(pasted.length, DIGITS - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (token.length !== DIGITS) return
    await verifyEmailOtp(storedEmail, token)
  }

  const handleResend = async () => {
    if (!storedEmail) return
    setResendState('loading')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: storedEmail,
    })
    setResendState(error ? 'error' : 'sent')
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* 左パネル */}
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
              'radial-gradient(circle at 78% 18%, rgba(255,255,255,0.12) 0, transparent 26%), linear-gradient(145deg, transparent 44%, rgba(255,255,255,0.05) 44%, rgba(255,255,255,0.05) 47%, transparent 47%)',
          }}
        />

        <div className="pointer-events-none absolute -bottom-8 -left-6 select-none">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.05]"
            style={{ fontSize: 'clamp(120px, 20vw, 260px)' }}
          >
            VER
            <br />IFY.
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
            EMAIL
            <br />
            VERI
            <br />
            FY.
          </h2>
          <p className="max-w-[240px] text-[12px] leading-[1.8] text-white/35">
            メールに届いた6桁のコードを入力して登録を完了してください。
          </p>
        </div>

        <div className="relative flex items-center gap-3">
          <span className="h-[2px] w-6 bg-white/25" />
          <span className="font-headline text-[8px] font-black uppercase tracking-[0.5em] text-white/20">
            Email Verification
          </span>
        </div>
      </div>

      {/* 右パネル */}
      <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-white px-8 py-12 sm:px-12 md:px-16 lg:px-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/5 to-transparent" />

        <div className="mb-10 lg:hidden">
          <p className="mb-1 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/35">
            FINDE
          </p>
          <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground">
            VERIFY
          </h1>
        </div>

        <div className="relative mx-auto w-full max-w-[380px]">
          <div className="wish-card-enter mb-8">
            <p className="mb-2 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/35">
              Email verification
            </p>
            <h1 className="font-headline text-2xl font-black leading-tight tracking-tight text-foreground">
              認証コードを入力してください。
            </h1>
          </div>

          <div className="wish-card-enter mb-8 border-l-[3px] border-l-border bg-muted/35 px-4 py-4">
            <p className="font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/40">
              送信先
            </p>
            <p className="mt-1 text-[13px] font-medium text-foreground/80">
              {storedEmail || 'メールアドレス未取得'}
            </p>
          </div>

          {error && (
            <div className="wish-card-enter mb-6 border-l-[3px] border-l-red-400 bg-red-50 px-4 py-3">
              <p className="text-[11px] font-medium text-red-700">
                コードが正しくないか、有効期限が切れています。
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 6桁コード入力 */}
            <div className="wish-card-enter">
              <label className="mb-3 block font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/45">
                認証コード（6桁）
              </label>
              <div className="flex gap-2" onPaste={handlePaste}>
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={cn(
                      'h-14 w-full border-b-2 bg-transparent text-center text-[22px] font-black text-foreground',
                      'transition-colors duration-200 focus:outline-none',
                      digit ? 'border-foreground' : 'border-border focus:border-foreground',
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="wish-card-enter">
              <button
                type="submit"
                disabled={loading || token.length !== DIGITS}
                className="w-full bg-primary py-4 font-headline text-[10px] font-black uppercase tracking-[0.4em] text-white transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {loading ? '確認中…' : '登録を完了する'}
              </button>
            </div>
          </form>

          {/* 再送 */}
          <div className="wish-card-enter mt-6 border-t border-border pt-6">
            <p className="mb-3 text-[11px] text-muted-foreground/60">
              コードが届かない場合は再送できます。
            </p>
            {resendState === 'sent' ? (
              <p className="text-[11px] font-medium text-foreground/70">
                再送しました。メールをご確認ください。
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendState === 'loading' || !storedEmail}
                className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-foreground underline underline-offset-4 transition-opacity hover:opacity-60 disabled:opacity-40"
              >
                {resendState === 'loading' ? '送信中…' : 'コードを再送する'}
              </button>
            )}
            {resendState === 'error' && (
              <p className="mt-2 text-[11px] text-red-500">再送に失敗しました。</p>
            )}
          </div>

          <p
            className="wish-card-enter mt-6 text-center font-headline text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/35"
            style={{ animationDelay: '80ms' }}
          >
            登録に戻る{' '}
            <Link
              to="/auth/register"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              新規登録へ
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage
