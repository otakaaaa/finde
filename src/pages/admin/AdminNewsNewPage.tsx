import { useNavigate, Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Globe } from 'lucide-react'
import { useCreatePressRelease } from '@/hooks/usePressReleases'
import { cn } from '@/lib/utils'

const newsSchema = z.object({
  title: z.string().min(1, '必須です').max(100, '100文字以内で入力してください'),
  body: z.string().min(1, '必須です').max(10_000, '10,000文字以内で入力してください'),
  publishedAt: z.string().optional(),
})

type NewsFormValues = z.infer<typeof newsSchema>

const AdminNewsNewPage = () => {
  const navigate = useNavigate()
  const { mutate: create, isPending } = useCreatePressRelease()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewsFormValues>({ resolver: zodResolver(newsSchema) })

  const submit = (values: NewsFormValues, publishNow: boolean) => {
    const publishedAt = publishNow ? new Date().toISOString() : null

    create(
      { title: values.title, body: values.body, publishedAt },
      { onSuccess: () => navigate('/admin/news') },
    )
  }

  return (
    <div>
      {/* ── Page header ───────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            NEW
          </span>
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— ADMIN / NEWS</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              お知らせ新規作成
            </h1>
          </div>
        </div>
      </section>

      {/* ── Form ─────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-16 md:py-14">
          <Link
            to="/admin/news"
            className="mb-8 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            一覧へ戻る
          </Link>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Title */}
            <div className="space-y-2">
              <label className="block font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                {...register('title')}
                className={cn(
                  'w-full border bg-white px-4 py-3 font-headline text-sm font-black tracking-tight text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20',
                  errors.title ? 'border-red-400' : 'border-border',
                )}
                placeholder="お知らせのタイトル"
              />
              {errors.title && (
                <p className="text-[11px] text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Body */}
            <div className="space-y-2">
              <label className="block font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
                本文（Markdown） <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('body')}
                rows={16}
                className={cn(
                  'w-full border bg-white px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-y',
                  errors.body ? 'border-red-400' : 'border-border',
                )}
                placeholder="Markdown で本文を入力してください"
              />
              {errors.body && (
                <p className="text-[11px] text-red-500">{errors.body.message}</p>
              )}
            </div>

            {/* PublishedAt */}
            <div className="space-y-2">
              <label className="block font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
                公開日時（空欄 = 下書き）
              </label>
              <input
                type="datetime-local"
                {...register('publishedAt')}
                className="border border-border bg-white px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSubmit((v) => submit(v, false))}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 border border-border bg-white px-6 py-3 font-headline text-[11px] font-black uppercase tracking-[0.25em] text-foreground/70 transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                下書き保存
              </button>
              <button
                type="button"
                onClick={handleSubmit((v) => submit(v, true))}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 border border-foreground bg-foreground px-6 py-3 font-headline text-[11px] font-black uppercase tracking-[0.25em] text-background transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                <Globe className="h-3.5 w-3.5" />
                今すぐ公開
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminNewsNewPage
