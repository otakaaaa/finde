import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router'
import { useAuthActions } from '@/hooks/useAuthActions'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  displayName: z.string().min(1, '表示名を入力してください').max(50, '50文字以内で入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(/[A-Za-z]/, 'パスワードにはアルファベットを含めてください')
    .regex(/[0-9]/, 'パスワードには数字を含めてください'),
  passwordConfirm: z.string().min(1, 'パスワードを再入力してください'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'パスワードが一致しません',
  path: ['passwordConfirm'],
})

type RegisterFormValues = z.infer<typeof registerSchema>

// ── Shared sub-components ──────────────────────────────────────

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

interface LineFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  fieldId: string
  error?: string
  hint?: string
  animDelay?: number
}

const LineField = ({ label, fieldId, error, hint, animDelay = 0, ...props }: LineFieldProps) => (
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
    {hint && !error && (
      <p className="mt-1.5 text-[9px] text-muted-foreground/40">{hint}</p>
    )}
    {error && (
      <p className="mt-1.5 text-[10px] text-red-500">{error}</p>
    )}
  </div>
)

// ── Page ───────────────────────────────────────────────────────

const RegisterPage = () => {
  const { loading, error, signUpWithEmail, signInWithGoogle } = useAuthActions()
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (values: RegisterFormValues) => {
    await signUpWithEmail(values.email, values.password, values.displayName)
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">

      {/* ── Left decorative panel ─────────────────── */}
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:w-[42%] lg:flex-col lg:justify-between lg:p-12">

        {/* Subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px)',
          }}
        />

        {/* Ghost watermark */}
        <div className="pointer-events-none absolute -bottom-8 -left-6 select-none">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.05]"
            style={{ fontSize: 'clamp(120px, 20vw, 260px)' }}
          >
            UP
          </span>
        </div>

        {/* Diagonal accent line */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, transparent 49.8%, rgba(255,255,255,0.04) 49.8%, rgba(255,255,255,0.04) 50.2%, transparent 50.2%)',
          }}
        />

        {/* Top: brand mark */}
        <div className="relative">
          <p className="font-headline text-[9px] font-black uppercase tracking-[0.6em] text-white/30">
            FINDE
          </p>
        </div>

        {/* Center: headline */}
        <div className="relative">
          <div className="mb-6 h-px w-10 bg-white/20" />
          <h2 className="mb-5 font-headline text-[52px] font-black leading-[0.88] tracking-tighter text-white">
            START<br />YOUR<br />JOURNEY.
          </h2>
          <p className="max-w-[200px] text-[12px] leading-[1.8] text-white/35">
            アカウントを作成して<br />理想の一着を探そう。
          </p>
        </div>

        {/* Bottom: step indicator */}
        <div className="relative flex items-center gap-3">
          <span className="h-[2px] w-6 bg-white/25" />
          <span className="font-headline text-[8px] font-black uppercase tracking-[0.5em] text-white/20">
            Register
          </span>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────── */}
      <div className="flex flex-1 flex-col justify-center bg-white px-8 py-12 sm:px-12 md:px-16 lg:px-20">

        {/* Mobile brand header */}
        <div className="mb-10 lg:hidden">
          <p className="mb-1 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/35">
            FINDE
          </p>
          <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground">
            REGISTER
          </h1>
        </div>

        <div className="mx-auto w-full max-w-[360px]">

          {/* Desktop heading */}
          <div className="mb-8 hidden lg:block">
            <p className="mb-1 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/35">
              アカウント作成
            </p>
            <h1 className="font-headline text-2xl font-black tracking-tight text-foreground">
              新規登録
            </h1>
          </div>

          {/* Auth error */}
          {error && (
            <div className="wish-card-enter mb-6 border-l-[3px] border-l-red-400 bg-red-50 px-4 py-3">
              <p className="text-[11px] font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Google OAuth */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="wish-card-enter mb-6 flex w-full items-center justify-center gap-2.5 border border-border py-3 font-headline text-[10px] font-black uppercase tracking-[0.25em] text-foreground/60 transition-all hover:border-foreground/25 hover:bg-muted/50 disabled:opacity-50"
            style={{ animationDelay: '0ms' }}
          >
            <GoogleIcon />
            Google で登録
          </button>

          {/* Divider */}
          <div
            className="wish-card-enter mb-6 flex items-center gap-3"
            style={{ animationDelay: '40ms' }}
          >
            <span className="flex-1 border-t border-border" />
            <span className="font-headline text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
              または
            </span>
            <span className="flex-1 border-t border-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <LineField
              label="表示名"
              fieldId="displayName"
              type="text"
              placeholder="ニックネーム"
              autoComplete="nickname"
              error={errors.displayName?.message}
              animDelay={80}
              {...register('displayName')}
            />

            <LineField
              label="メールアドレス"
              fieldId="email"
              type="email"
              placeholder="example@email.com"
              autoComplete="email"
              error={errors.email?.message}
              animDelay={120}
              {...register('email')}
            />

            <LineField
              label="パスワード"
              fieldId="password"
              type="password"
              placeholder="英数字 8文字以上"
              autoComplete="new-password"
              hint="アルファベットと数字を含む 8文字以上"
              error={errors.password?.message}
              animDelay={160}
              {...register('password')}
            />

            <LineField
              label="パスワード（確認）"
              fieldId="passwordConfirm"
              type="password"
              placeholder="パスワードを再入力"
              autoComplete="new-password"
              error={errors.passwordConfirm?.message}
              animDelay={200}
              {...register('passwordConfirm')}
            />

            <div className="wish-card-enter pt-3" style={{ animationDelay: '240ms' }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary py-4 font-headline text-[10px] font-black uppercase tracking-[0.4em] text-white transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {loading ? '登録中…' : 'アカウントを作成'}
              </button>
            </div>
          </form>

          {/* Footer link */}
          <p
            className="wish-card-enter mt-8 text-center font-headline text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/35"
            style={{ animationDelay: '280ms' }}
          >
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
