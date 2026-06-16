import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Save, Eye, Send } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { useCreateShare, useUpdateShare } from '@/hooks/useShareMutations'
import { SharePhotoUpload, type SharePhotoSelection } from '@/components/share/SharePhotoUpload'
import { ShareVisibilitySelect } from '@/components/share/ShareVisibilitySelect'
import { ShareShopPicker, type PickedShop } from '@/components/share/ShareShopPicker'
import { SharePreviewModal } from '@/components/share/SharePreviewModal'
import { getSharePhotoUrl } from '@/components/share/sharePhoto'
import { SectionLabel } from '@/components/shop/ShopFormUI'
import type { SharePost, ShareState, ShareVisibility } from '@/types'

const MAX_BODY = 1000

interface SharePostFormProps {
  mode: 'create' | 'edit'
  initial?: SharePost
}

export const SharePostForm = ({ mode, initial }: SharePostFormProps) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useUiStore()
  const create = useCreateShare()
  const update = useUpdateShare()

  const [body, setBody] = useState(initial?.body ?? '')
  const [visibility, setVisibility] = useState<ShareVisibility>(initial?.visibility ?? 'public')
  const [shops, setShops] = useState<PickedShop[]>(
    (initial?.shops ?? []).map((s) => ({ id: s.id, name: s.name })),
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

  const validate = (): string | null => {
    const trimmed = body.trim()
    if (trimmed.length < 1) return '本文を入力してください'
    if (trimmed.length > MAX_BODY) return `本文は${MAX_BODY}文字以内で入力してください`
    return null
  }

  const submit = (state: ShareState) => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)

    const shopIds = shops.map((s) => s.id)
    const onSuccess = (postId: string) => {
      addToast({
        title: state === 'draft' ? '下書きを保存しました' : '投稿を公開しました',
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
    <div>
      {error && (
        <div className="mb-6 border-l-2 border-red-400 bg-red-50/50 py-2 pl-3 pr-4">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="md:grid md:grid-cols-[2fr_3fr] md:gap-10 lg:gap-14">

        {/* ── Left: 画像 ─────────────────────────────── */}
        <div>
          <SectionLabel num="01" title="写真" optional />
          <SharePhotoUpload existingPhotos={initial?.photos} onChange={handlePhotoChange} />
        </div>

        {/* ── Right: Content ──────────────────────────── */}
        <div className="mt-8 flex flex-col md:mt-0">

          {/* Body */}
          <div className="border-b border-border pb-6">
            <SectionLabel num="02" title="本文" required />
            <textarea
              rows={8}
              value={body}
              maxLength={MAX_BODY}
              onChange={(e) => setBody(e.target.value)}
              placeholder="今日のおしゃれ、こだわり、言動など…"
              className="w-full resize-none bg-transparent text-[15px] leading-[1.9] text-foreground/80 placeholder:text-muted-foreground/20 focus:outline-none"
            />
            <p className="text-right text-[9px] tabular-nums text-muted-foreground/25">
              {body.length}
              <span className="text-muted-foreground/20"> / {MAX_BODY}</span>
            </p>
          </div>

          {/* Shop */}
          <div className="border-b border-border py-5">
            <SectionLabel num="03" title="関連店舗" optional />
            <ShareShopPicker selected={shops} onChange={setShops} />
          </div>

          {/* Visibility */}
          <div className="border-b border-border py-5">
            <SectionLabel num="04" title="公開範囲" />
            <ShareVisibilitySelect value={visibility} onChange={setVisibility} />
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-6">
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
                  {mode === 'create' ? <><Send className="h-3.5 w-3.5" />投稿する</> : <><Save className="h-3.5 w-3.5" />変更を保存</>}
                </>
              )}
            </button>

            <div className="flex gap-2">
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
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-3.5 py-2.5 text-[9px] font-medium text-muted-foreground/35 transition-colors hover:text-foreground/60"
              >
                ✕
              </button>
            </div>
          </div>

        </div>
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
