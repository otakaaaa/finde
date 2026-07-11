import { useState } from 'react'
import { useNavigate, useParams, Link, Navigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowLeft, Save, Globe, EyeOff, Trash2 } from 'lucide-react'
import {
  useAdminPressRelease,
  useUpdatePressRelease,
  useDeletePressRelease,
} from '@/hooks/usePressReleases'
import { cn } from '@/lib/utils'

const newsSchema = z.object({
  title: z.string().min(1, '必須です').max(100, '100文字以内で入力してください'),
  body: z.string().min(1, '必須です').max(10_000, '10,000文字以内で入力してください'),
  publishedAt: z.string().optional(),
})

type NewsFormValues = z.infer<typeof newsSchema>

const toDatetimeLocal = (iso: string | null): string => {
  if (!iso) return ''
  return iso.slice(0, 16)
}

const AdminNewsEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: item, isLoading, isError } = useAdminPressRelease(id ?? '')
  const { mutate: update, isPending: isUpdating } = useUpdatePressRelease()
  const { mutate: remove, isPending: isDeleting } = useDeletePressRelease()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    values: item
      ? { title: item.title, body: item.body, publishedAt: toDatetimeLocal(item.publishedAt) }
      : undefined,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 md:px-16 space-y-4">
        <div className="h-8 w-1/2 animate-pulse rounded-sm bg-muted" />
        <div className="h-60 animate-pulse rounded-sm bg-muted" />
      </div>
    )
  }

  if (isError || item == null) {
    return <Navigate to="/admin/news" replace />
  }

  const isPublished = item.publishedAt !== null

  const submit = (values: NewsFormValues, publishNow?: boolean) => {
    const publishedAt = publishNow
      ? (values.publishedAt ? new Date(values.publishedAt).toISOString() : new Date().toISOString())
      : null

    update(
      { id: id!, title: values.title, body: values.body, publishedAt },
      { onSuccess: () => navigate('/admin/news') },
    )
  }

  const handleDelete = () => {
    remove(id!, { onSuccess: () => navigate('/admin/news') })
  }

  return (
    <div>
      {/* ── Page header ───────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-foreground/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            EDIT
          </span>
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-foreground/40">— ADMIN / NEWS</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground md:text-4xl">
              お知らせ編集
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

          {/* Status indicator */}
          <div className="mb-6 flex items-center gap-2">
            <span
              className={cn(
                'rounded-sm px-2 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider',
                isPublished
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-muted text-muted-foreground/50',
              )}
            >
              {isPublished ? '公開済み' : '下書き'}
            </span>
            {isPublished && item.publishedAt && (
              <span className="font-headline text-[10px] font-black tabular-nums text-muted-foreground/30">
                {new Date(item.publishedAt).toLocaleString('ja-JP')}
              </span>
            )}
          </div>

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
              />
              {errors.body && (
                <p className="text-[11px] text-red-500">{errors.body.message}</p>
              )}
            </div>

            {/* PublishedAt */}
            <div className="space-y-2">
              <label className="block font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
                公開日時
              </label>
              <input
                type="datetime-local"
                {...register('publishedAt')}
                className="border border-border bg-white px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
              <p className="text-[10px] text-muted-foreground/40">
                空欄の場合は「公開する」押下時に即時公開。未来の日時を指定するとその日時以降に公開されます。
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleSubmit((v) => submit(v))}
                disabled={isUpdating}
                className="inline-flex items-center gap-2 border border-border bg-white px-6 py-3 font-headline text-[11px] font-black uppercase tracking-[0.25em] text-foreground/70 transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                保存
              </button>

              <button
                type="button"
                onClick={handleSubmit((v) => submit(v, true))}
                disabled={isUpdating}
                className="inline-flex items-center gap-2 border border-foreground bg-foreground px-6 py-3 font-headline text-[11px] font-black uppercase tracking-[0.25em] text-background transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                <Globe className="h-3.5 w-3.5" />
                公開する
              </button>

              {isPublished && (
                <button
                  type="button"
                  onClick={handleSubmit((v) => submit(v))}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 border border-amber-300 bg-amber-50 px-6 py-3 font-headline text-[11px] font-black uppercase tracking-[0.25em] text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  非公開に戻す
                </button>
              )}
            </div>
          </form>

          {/* Delete section */}
          <div className="mt-14 border-t border-border pt-8">
            <p className="mb-3 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
              危険な操作
            </p>
            <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
              <Dialog.Trigger asChild>
                <button className="inline-flex items-center gap-2 border border-red-200 bg-red-50 px-5 py-2.5 font-headline text-[10px] font-black uppercase tracking-[0.2em] text-red-600 transition-colors hover:bg-red-100">
                  <Trash2 className="h-3.5 w-3.5" />
                  このお知らせを削除
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="modal-backdrop-enter fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm" />
                <Dialog.Content className="modal-enter fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 border border-border bg-background p-8 editorial-shadow">
                  <Dialog.Title className="font-headline text-lg font-black tracking-tight text-foreground">
                    削除の確認
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-[13px] leading-relaxed text-muted-foreground/60">
                    「{item.title}」を削除します。この操作は取り消せません。
                  </Dialog.Description>
                  <div className="mt-6 flex justify-end gap-3">
                    <Dialog.Close asChild>
                      <button className="border border-border bg-white px-5 py-2 font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 transition-colors hover:text-foreground">
                        キャンセル
                      </button>
                    </Dialog.Close>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="border border-red-500 bg-red-500 px-5 py-2 font-headline text-[10px] font-black uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                    >
                      削除する
                    </button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminNewsEditPage
