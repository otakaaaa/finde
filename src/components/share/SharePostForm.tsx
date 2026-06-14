import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Save, Eye, Send } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { useCreateShare, useUpdateShare } from '@/hooks/useShareMutations'
import { SectionLabel } from '@/components/shop/ShopFormUI'
import { SharePhotoUpload, type SharePhotoSelection } from '@/components/share/SharePhotoUpload'
import { ShareVisibilitySelect } from '@/components/share/ShareVisibilitySelect'
import { ShareShopPicker, type PickedShop } from '@/components/share/ShareShopPicker'
import { SharePreviewModal } from '@/components/share/SharePreviewModal'
import { getSharePhotoUrl } from '@/components/share/sharePhoto'
import { cn } from '@/lib/utils'
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
    <div className="space-y-10">
      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* 01 本文 */}
      <section>
        <SectionLabel num="01" title="本文" required />
        <textarea
          rows={5}
          value={body}
          maxLength={MAX_BODY}
          onChange={(e) => setBody(e.target.value)}
          placeholder="今日のおしゃれ、こだわり、言動など…"
          className="w-full resize-none rounded-sm border border-border bg-white px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <p className="mt-1 text-right text-[9px] tabular-nums text-muted-foreground/40">
          {body.length}/{MAX_BODY}
        </p>
      </section>

      {/* 02 写真 */}
      <section>
        <SectionLabel num="02" title="写真" optional />
        <SharePhotoUpload existingPhotos={initial?.photos} onChange={handlePhotoChange} />
      </section>

      {/* 03 関連店舗 */}
      <section>
        <SectionLabel num="03" title="関連店舗" optional />
        <ShareShopPicker selected={shops} onChange={setShops} />
      </section>

      {/* 04 公開範囲 */}
      <section>
        <SectionLabel num="04" title="公開範囲" />
        <ShareVisibilitySelect value={visibility} onChange={setVisibility} />
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-8">
        <button
          type="button"
          onClick={() => submit('published')}
          disabled={isPending}
          className={cn(
            'inline-flex items-center gap-2 bg-primary px-8 py-3 text-xs font-black uppercase tracking-[0.3em] text-white transition-opacity',
            'hover:opacity-90 disabled:opacity-40',
          )}
        >
          <Send className="h-3.5 w-3.5" />
          公開する
        </button>
        <button
          type="button"
          onClick={() => submit('draft')}
          disabled={isPending}
          className="inline-flex items-center gap-2 border border-border px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:border-foreground disabled:opacity-40"
        >
          <Save className="h-3.5 w-3.5" />
          下書き保存
        </button>
        <button
          type="button"
          onClick={openPreview}
          className="inline-flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Eye className="h-3.5 w-3.5" />
          プレビュー
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          キャンセル
        </button>
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
