import { Fragment, useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Save, Eye, Send, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { useCreateShare, useUpdateShare } from '@/hooks/useShareMutations'
import { SharePhotoUpload, type SharePhotoSelection } from '@/components/share/SharePhotoUpload'
import { ShareVisibilitySelect } from '@/components/share/ShareVisibilitySelect'
import { ShareShopPicker, type PickedShop } from '@/components/share/ShareShopPicker'
import { SharePreviewModal } from '@/components/share/SharePreviewModal'
import { getSharePhotoUrl, SHARE_PHOTO_MAX_COUNT } from '@/components/share/sharePhoto'
import { cn } from '@/lib/utils'
import type { SharePost, ShareState, ShareVisibility } from '@/types'

const MAX_BODY = 1000

const STEPS = [
  { num: '01', title: '写真', label: 'optional' },
  { num: '02', title: '本文', label: 'required' },
  { num: '03', title: '関連店舗', label: 'optional' },
  { num: '04', title: '公開範囲', label: '' },
]

interface SharePostFormProps {
  mode: 'create' | 'edit'
  initial?: SharePost
  /** 新規作成時にあらかじめ選択しておく関連店舗（店舗詳細からの導線用） */
  initialShops?: PickedShop[]
}

export const SharePostForm = ({ mode, initial, initialShops }: SharePostFormProps) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useUiStore()
  const create = useCreateShare()
  const update = useUpdateShare()

  const [step, setStep] = useState(0)
  const [body, setBody] = useState(initial?.body ?? '')
  const [visibility, setVisibility] = useState<ShareVisibility>(initial?.visibility ?? 'public')
  const [shops, setShops] = useState<PickedShop[]>(
    initial
      ? initial.shops.map((s) => ({ id: s.id, name: s.name }))
      : initialShops ?? [],
  )
  const [selection, setSelection] = useState<SharePhotoSelection>({
    keepPhotoIds: (initial?.photos ?? []).map((p) => p.id),
    newFiles: [],
  })
  const [error, setError] = useState<string | null>(null)
  const [previewUrls, setPreviewUrls] = useState<string[] | null>(null)
  const previewObjectUrls = useRef<string[]>([])

  const handlePhotoChange = useCallback((next: SharePhotoSelection) => setSelection(next), [])

  const isPending = create.isPending || update.isPending
  const isFirstStep = step === 0
  const isLastStep = step === STEPS.length - 1

  const validate = (): string | null => {
    const trimmed = body.trim()
    if (trimmed.length < 1) return '本文を入力してください'
    if (trimmed.length > MAX_BODY) return `本文は${MAX_BODY}文字以内で入力してください`
    return null
  }

  const goNext = () => {
    if (step === 0) {
      const photoCount = selection.keepPhotoIds.length + selection.newFiles.length
      if (photoCount > SHARE_PHOTO_MAX_COUNT) {
        setError(`画像は最大${SHARE_PHOTO_MAX_COUNT}枚までです。${photoCount - SHARE_PHOTO_MAX_COUNT}枚削除してください。`)
        return
      }
    }
    if (step === 1) {
      const err = validate()
      if (err) { setError(err); return }
    }
    setError(null)
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const goPrev = () => {
    setError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  const submit = (state: ShareState) => {
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError(null)

    const shopIds = shops.map((s) => s.id)
    const onSuccess = (postId: string) => {
      addToast({
        title: state === 'draft' ? '下書きを保存しました' : mode === 'create' ? '投稿を公開しました' : '変更を保存しました',
        variant: 'default',
      })
      navigate(state === 'draft' ? '/mypage/share/drafts' : `/share/${postId}`)
    }
    const onError = (e: unknown) => {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    }

    if (mode === 'create') {
      create.mutate(
        { body: body.trim(), visibility, state, shopIds, files: selection.newFiles },
        { onSuccess, onError },
      )
    } else if (initial) {
      update.mutate(
        {
          id: initial.id,
          body: body.trim(),
          visibility,
          state,
          shopIds,
          keepPhotoIds: selection.keepPhotoIds,
          newFiles: selection.newFiles,
        },
        { onSuccess: () => onSuccess(initial.id), onError },
      )
    }
  }

  const openPreview = () => {
    const existingUrls = (initial?.photos ?? [])
      .filter((p) => selection.keepPhotoIds.includes(p.id))
      .map((p) => getSharePhotoUrl(p.storagePath, { width: 1000, height: 1000 }))
    const newUrls = selection.newFiles.map((f) => URL.createObjectURL(f))
    previewObjectUrls.current = newUrls
    setPreviewUrls([...existingUrls, ...newUrls])
  }

  const closePreview = () => {
    previewObjectUrls.current.forEach((u) => URL.revokeObjectURL(u))
    previewObjectUrls.current = []
    setPreviewUrls(null)
  }

  return (
    <div className="mx-auto max-w-lg">

      {/* ── ステップインジケーター ── */}
      <div className="mb-10">
        {/* ドット + 接続線 */}
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <Fragment key={s.num}>
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center font-headline text-[10px] font-black tabular-nums transition-colors',
                  i === step
                    ? 'bg-foreground text-background'
                    : i < step
                      ? 'bg-primary/80 text-white'
                      : 'bg-muted text-muted-foreground/30',
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : s.num}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn('h-px flex-1 transition-colors', i < step ? 'bg-primary/40' : 'bg-border')}
                />
              )}
            </Fragment>
          ))}
        </div>

        {/* ステップ名 */}
        <div className="mt-5">
          {/* <p className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/35">
            Step {step + 1} / {STEPS.length}
          </p> */}
          <div className="mt-1 flex items-baseline gap-2.5">
            <h2 className="font-headline text-2xl font-black tracking-tight text-foreground">
              {STEPS[step].title}
            </h2>
            {STEPS[step].label === 'required' && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                必須
              </span>
            )}
            {STEPS[step].label === 'optional' && (
              <span className="inline-flex items-center gap-1 rounded-sm border border-muted-foreground/20 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/40">
                <span className="h-1.5 w-1.5 rounded-full border border-muted-foreground/30" />
                任意
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── エラー ── */}
      {error && (
        <div className="mb-6 border-l-2 border-red-400 bg-red-50/50 py-2 pl-3 pr-4">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* ── ステップコンテンツ ── */}
      <div key={step} className="wish-card-enter min-h-[200px]">
        {step === 0 && (
          <SharePhotoUpload existingPhotos={initial?.photos} onChange={handlePhotoChange} />
        )}

        {step === 1 && (
          <div>
            <textarea
              rows={10}
              value={body}
              maxLength={MAX_BODY}
              onChange={(e) => setBody(e.target.value)}
              placeholder="今日のおしゃれ、こだわり、言動など…"
              autoFocus
              className="w-full resize-none border-b border-border bg-transparent py-2 text-[15px] leading-[1.9] text-foreground/80 placeholder:text-muted-foreground/20 focus:border-foreground/30 focus:outline-none"
            />
            <p className="mt-2 text-right text-[9px] tabular-nums text-muted-foreground/30">
              {body.length}
              <span className="text-muted-foreground/20"> / {MAX_BODY}</span>
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="mb-1.5 text-[12px] leading-relaxed text-muted-foreground/60">
              投稿に関連するお店を追加できます。訪問したお店や、アイテムを購入したお店など。
            </p>
            <p className="mb-5 text-[12px] leading-relaxed text-muted-foreground/60">
              お店が見つからない場合は、
              <a
                href="/listing-request"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-75"
              >
                店舗掲載申請
              </a>
              からお気軽にご申請ください。
            </p>
            <ShareShopPicker selected={shops} onChange={setShops} />
          </div>
        )}

        {step === 3 && (
          <ShareVisibilitySelect value={visibility} onChange={setVisibility} />
        )}
      </div>

      {/* ── ナビゲーション ── */}
      <div className="mt-10 space-y-2.5">
        {isLastStep ? (
          /* 最終ステップ */
          <>
            <button
              type="button"
              onClick={() => submit('published')}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2.5 bg-foreground py-3.5 text-[11px] font-black uppercase tracking-[0.4em] text-background transition-opacity hover:opacity-80 disabled:opacity-30"
            >
              {isPending ? (
                <span className="opacity-60">投稿中…</span>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  {mode === 'create' ? '投稿する' : '変更を保存'}
                </>
              )}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={isPending}
                className="px-3.5 py-2.5 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/35 transition-colors hover:text-foreground/70 disabled:opacity-30"
              >
                ← 前へ
              </button>
              <button
                type="button"
                onClick={() => submit('draft')}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-1.5 border border-border py-2.5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/45 transition-colors hover:border-foreground/20 hover:text-foreground/65 disabled:opacity-30"
              >
                <Save className="h-3 w-3" />
                下書き保存
              </button>
              <button
                type="button"
                onClick={openPreview}
                className="flex flex-1 items-center justify-center gap-1.5 border border-border py-2.5 text-[9px] font-black uppercase tracking-[0.25em] text-foreground/45 transition-colors hover:border-foreground/20 hover:text-foreground/65"
              >
                <Eye className="h-3 w-3" />
                プレビュー
              </button>
            </div>
          </>
        ) : (
          /* 途中ステップ */
          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <button
                type="button"
                onClick={goPrev}
                className="px-3.5 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/35 transition-colors hover:text-foreground/70"
              >
                ← 前へ
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="flex flex-1 items-center justify-center gap-2 bg-foreground py-3.5 text-[11px] font-black uppercase tracking-[0.35em] text-background transition-opacity hover:opacity-80"
            >
              次へ →
            </button>
          </div>
        )}
      </div>

      {previewUrls !== null && (
        <SharePreviewModal
          authorName={user?.displayName ?? 'あなた'}
          body={body.trim()}
          visibility={visibility}
          photoUrls={previewUrls}
          shops={shops}
          onClose={closePreview}
        />
      )}
    </div>
  )
}
