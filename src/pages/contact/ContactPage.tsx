import { useState } from 'react'
import { CheckCircle2, Send, Mail, Flag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────

type Category = 'general' | 'shop_listing' | 'bug_report' | 'account' | 'other'

interface FormState {
  name: string
  email: string
  category: Category | ''
  subject: string
  body: string
  isNoreply: boolean
}

// ── Config ─────────────────────────────────────────────────────

const CATEGORIES: { value: Category; label: string; sublabel: string }[] = [
  { value: 'general',      label: '一般的なご質問',     sublabel: 'General' },
  { value: 'shop_listing', label: '店舗掲載について',    sublabel: 'Listing' },
  { value: 'bug_report',   label: 'バグ・不具合',        sublabel: 'Bug Report' },
  { value: 'account',      label: 'アカウントについて',   sublabel: 'Account' },
  { value: 'other',        label: 'その他',              sublabel: 'Other' },
]

const FIELD_LABELS = [
  { num: '01', label: 'お名前',                 required: true },
  { num: '02', label: 'メールアドレス',          required: true },
  { num: '03', label: 'お問い合わせカテゴリ',    required: true },
  { num: '04', label: '件名',                   required: true },
  { num: '05', label: 'お問い合わせ内容',        required: true },
]

// ── Sub-components ─────────────────────────────────────────────

const SectionNum = ({ num }: { num: string }) => (
  <span className="font-headline text-[10px] font-black tabular-nums text-muted-foreground/20">
    {num}
  </span>
)

const FieldLabel = ({
  num,
  label,
  required,
}: {
  num: string
  label: string
  required?: boolean
}) => (
  <div className="mb-2 flex items-baseline gap-2.5">
    <SectionNum num={num} />
    <label className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
      {label}
    </label>
    {required && (
      <span className="text-[9px] font-bold text-red-500/70">required</span>
    )}
  </div>
)

const inputClass = cn(
  'w-full border border-border bg-white px-3 py-2.5 text-sm text-foreground/80',
  'placeholder:text-muted-foreground/30 transition-colors',
  'focus:border-foreground/30 focus:outline-none',
)

// ── Page ───────────────────────────────────────────────────────

const ContactPage = () => {
  const { user, session } = useAuth()

  const [form, setForm] = useState<FormState>({
    name:        user?.displayName ?? '',
    email:       session?.user?.email ?? '',
    category:    '',
    subject:     '',
    body:        '',
    isNoreply:   false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneId, setDoneId] = useState<string | null>(null)

  const set = (k: keyof FormState, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const isValid =
    form.name.trim() &&
    form.email.trim() &&
    form.category &&
    form.subject.trim() &&
    form.body.trim()

  const handleSubmit = async () => {
    if (!isValid) return
    setSubmitting(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('contact_inquiries')
      .insert({
        name:         form.name.trim(),
        email:        form.email.trim(),
        category:     form.category,
        subject:      form.subject.trim(),
        body:         form.body.trim(),
        is_noreply:   form.isNoreply,
        user_id:      user?.id ?? null,
      } as never)
      .select('id')
      .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

    setSubmitting(false)

    if (err) {
      setError('送信に失敗しました。しばらく経ってから再度お試しください。')
      return
    }

    setDoneId(data?.id ?? 'unknown')
  }

  // ── Success state ─────────────────────────────────────────────
  if (doneId) {
    return (
      <div>
        <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
          <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
            <span
              className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
              style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
            >
              SENT
            </span>
          </div>
          <div className="relative mx-auto max-w-3xl pb-8">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Contact</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              SENT
            </h1>
          </div>
        </section>

        <div className="bg-background">
          <div className="mx-auto max-w-3xl px-4 py-20 md:px-16 md:py-24">
            <div className="wish-card-enter flex flex-col items-center gap-5 border border-border bg-white px-8 py-14 text-center editorial-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-headline text-2xl font-black leading-none tracking-tight text-foreground">
                  送信が完了しました
                </h2>
                <p className="mt-3 text-[11px] leading-[1.9] text-muted-foreground/60">
                  お問い合わせありがとうございます。<br />
                  内容を確認の上、メールにてご連絡いたします。
                </p>
              </div>
              <div className="mt-2 border border-border bg-muted/50 px-5 py-3">
                <p className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                  受付番号
                </p>
                <p className="mt-1 font-headline text-xs font-black tracking-widest text-foreground/50">
                  {doneId.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <a
                href="/"
                className="mt-2 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 transition-colors hover:text-foreground"
              >
                トップへ戻る →
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            CONTACT
          </span>
        </div>

        <div className="relative mx-auto max-w-3xl">
          <div className="pb-8">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
              — Support
            </p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              お問い合わせ
            </h1>
            <p className="mt-4 max-w-sm text-[11px] leading-[1.8] text-white/40">
              ご不明な点やご要望はお気軽にお問い合わせください。<br />
              通常 1〜3 営業日以内にご返信いたします。
            </p>
          </div>
        </div>
      </section>

      {/* ── Form section ─────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-16 md:py-16">

          {/* Error */}
          {error && (
            <div className="mb-8 border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-8">

            {/* ── 01 Name ──────────────────────────── */}
            <div className="wish-card-enter" style={{ animationDelay: '0ms' }}>
              <FieldLabel {...FIELD_LABELS[0]} />
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="山田 太郎"
                className={inputClass}
              />
            </div>

            {/* ── 02 Email ─────────────────────────── */}
            <div className="wish-card-enter" style={{ animationDelay: '40ms' }}>
              <FieldLabel {...FIELD_LABELS[1]} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="example@email.com"
                className={inputClass}
              />
            </div>

            {/* ── 03 Category ──────────────────────── */}
            <div className="wish-card-enter" style={{ animationDelay: '80ms' }}>
              <FieldLabel {...FIELD_LABELS[2]} />
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const active = form.category === cat.value
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => set('category', cat.value)}
                      className={cn(
                        'flex flex-col items-start border px-3 py-2 transition-all duration-150',
                        active
                          ? 'border-foreground bg-foreground'
                          : 'border-border bg-white hover:border-foreground/20 hover:bg-muted/40',
                      )}
                    >
                      <span className={cn(
                        'font-headline text-[10px] font-black uppercase tracking-[0.2em]',
                        active ? 'text-white' : 'text-foreground/70',
                      )}>
                        {cat.label}
                      </span>
                      <span className={cn(
                        'text-[8px] font-bold uppercase tracking-widest',
                        active ? 'text-white/50' : 'text-muted-foreground/30',
                      )}>
                        {cat.sublabel}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── 04 Subject ───────────────────────── */}
            <div className="wish-card-enter" style={{ animationDelay: '120ms' }}>
              <FieldLabel {...FIELD_LABELS[3]} />
              <input
                type="text"
                value={form.subject}
                onChange={(e) => set('subject', e.target.value)}
                placeholder="お問い合わせの件名を入力してください"
                maxLength={100}
                className={inputClass}
              />
            </div>

            {/* ── 05 Body ──────────────────────────── */}
            <div className="wish-card-enter" style={{ animationDelay: '160ms' }}>
              <FieldLabel {...FIELD_LABELS[4]} />
              <textarea
                rows={7}
                value={form.body}
                onChange={(e) => set('body', e.target.value)}
                placeholder="お問い合わせ内容を詳しくご記入ください…"
                maxLength={2000}
                className={cn(inputClass, 'resize-none leading-relaxed')}
              />
              <p className="mt-1 text-right font-headline text-[9px] tabular-nums text-muted-foreground/20">
                {form.body.length} / 2000
              </p>
            </div>

            {/* ── 06 Reply needed ──────────────────── */}
            <div className="wish-card-enter" style={{ animationDelay: '200ms' }}>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, isNoreply: !prev.isNoreply }))}
                className={cn(
                  'flex w-full items-center gap-3 border px-4 py-3 text-left transition-all duration-150',
                  form.isNoreply
                    ? 'border-foreground/20 bg-muted/50'
                    : 'border-border bg-white hover:border-foreground/15 hover:bg-muted/40',
                )}
              >
                <div className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center border transition-colors',
                  form.isNoreply
                    ? 'border-foreground/30 bg-foreground'
                    : 'border-border bg-white',
                )}>
                  {form.isNoreply && (
                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Flag className="h-3 w-3 text-muted-foreground/40" />
                    <span className="font-headline text-[11px] font-black tracking-wide text-foreground/70">
                      返信不要
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/40">
                    返信が不要な場合はチェックしてください
                  </p>
                </div>
              </button>
            </div>

            {/* ── Submit ───────────────────────────── */}
            <div className="wish-card-enter border-t border-border pt-8" style={{ animationDelay: '240ms' }}>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isValid || submitting}
                  className={cn(
                    'flex items-center gap-2 bg-primary px-8 py-3.5',
                    'font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white',
                    'transition-opacity hover:opacity-80 disabled:opacity-30',
                  )}
                >
                  {submitting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      送信中...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      送信する
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40">
                  <Mail className="h-3 w-3" />
                  <span>通常 1〜3 営業日以内にご返信します</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
