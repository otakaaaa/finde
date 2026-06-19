import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Search, X, Plus, Tag, ImagePlus, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useItemCategoriesWithTypes } from '@/hooks/useShopItemTypes'
import { useCreateShopItem } from '@/hooks/useShopItems'
import { cn } from '@/lib/utils'
import type { Brand, MaterialType } from '@/types'

// ── Sub-types ───────────────────────────────────────────────────

interface MaterialTypeRow {
  id: number
  code: string
  name: string
  order: number
  is_active: boolean
}

// ── Data hooks ──────────────────────────────────────────────────

const useMaterialTypes = () =>
  useQuery({
    queryKey: ['material-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_types')
        .select('id, code, name, order, is_active')
        .eq('is_active', true)
        .order('order') as unknown as { data: MaterialTypeRow[] | null; error: { message: string } | null }
      if (error) throw new Error(error.message)
      return (data ?? []).map((m) => ({
        id: m.id,
        code: m.code,
        name: m.name,
        order: m.order,
        isActive: m.is_active,
      })) as MaterialType[]
    },
    staleTime: Infinity,
  })

const useSearchBrands = (query: string) =>
  useQuery({
    queryKey: ['brands-search', query],
    queryFn: async () => {
      const { data } = await supabase
        .from('brands')
        .select('id, name, name_kana, aliases, status, merged_into, submitted_by, created_at')
        .eq('status', 'active')
        .ilike('name', `%${query}%`)
        .limit(8) as unknown as { data: (Omit<Brand, 'nameKana' | 'mergedInto' | 'submittedBy' | 'createdAt'> & { name_kana: string | null; merged_into: string | null; submitted_by: string | null; created_at: string })[] | null }
      return (data ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        nameKana: b.name_kana,
        aliases: b.aliases,
        status: b.status,
        mergedInto: b.merged_into,
        submittedBy: b.submitted_by,
        createdAt: b.created_at,
      })) as Brand[]
    },
    enabled: query.trim().length >= 2,
  })

// ── Photo preview item ─────────────────────────────────────────

interface PhotoPreview {
  file: File
  url: string
}

// ── Page ───────────────────────────────────────────────────────

const ShopItemNewPage = () => {
  const { shopId } = useParams<{ shopId: string }>()
  const navigate = useNavigate()
  const { user, session } = useAuth()

  const { data: categories } = useItemCategoriesWithTypes()
  const { data: materials } = useMaterialTypes()
  const { mutate: createItem, isPending: isCreating } = useCreateShopItem()

  // ── Form state ──────────────────────────────────────────────
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>()
  const [selectedTypeId, setSelectedTypeId] = useState<number | undefined>()
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [brandQuery, setBrandQuery] = useState('')
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false)
  const [name, setName] = useState('')
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [sizeInput, setSizeInput] = useState('')
  const [sizes, setSizes] = useState<string[]>([])
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<Set<number>>(new Set())
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [isAvailable, setIsAvailable] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Material request state ─────────────────────────────────
  const [showMaterialRequest, setShowMaterialRequest] = useState(false)
  const [materialRequestName, setMaterialRequestName] = useState('')
  const [materialRequestSent, setMaterialRequestSent] = useState(false)
  const [materialRequestSending, setMaterialRequestSending] = useState(false)

  const brandSearchRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const { data: brandResults } = useSearchBrands(brandQuery)

  // Close brand dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (brandSearchRef.current && !brandSearchRef.current.contains(e.target as Node)) {
        setBrandDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Auto-generate item name
  useEffect(() => {
    if (nameManuallyEdited) return

    const category = categories?.find((c) => c.id === selectedCategoryId)
    const type = category?.types.find((t) => t.id === selectedTypeId)
    const brandName = selectedBrand?.name ?? ''

    let generated = ''
    if (brandName && type) {
      generated = `${brandName} ${type.name}`
    } else if (brandName) {
      generated = brandName
    } else if (type) {
      generated = type.name
    } else if (category) {
      generated = category.name
    }
    setName(generated)
  }, [selectedCategoryId, selectedTypeId, selectedBrand, categories, nameManuallyEdited])

  // ── Helpers ────────────────────────────────────────────────
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId)
  const filteredBrands = (brandResults ?? []).filter((b) => b.id !== selectedBrand?.id)

  const addSize = () => {
    const trimmed = sizeInput.trim().toUpperCase()
    if (trimmed && !sizes.includes(trimmed)) {
      setSizes((prev) => [...prev, trimmed])
    }
    setSizeInput('')
  }

  const removeSize = (s: string) => setSizes((prev) => prev.filter((x) => x !== s))

  const toggleMaterial = (id: number) => {
    setSelectedMaterialIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const remaining = 10 - photos.length
    const added = files.slice(0, remaining).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))
    setPhotos((prev) => [...prev, ...added])
    e.target.value = ''
  }, [photos.length])

  const removePhoto = (idx: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].url)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleMaterialRequest = async () => {
    if (!materialRequestName.trim() || !user) return
    setMaterialRequestSending(true)
    const authEmail = session?.user?.email ?? ''
    try {
      await supabase.from('contacts').insert({
        name: authEmail || 'オーナー',
        email: authEmail,
        category: 'material_request',
        subject: '素材追加リクエスト',
        body: `素材名: ${materialRequestName.trim()}\n店舗ID: ${shopId}\nユーザーID: ${user.id}`,
        user_id: user.id,
      } as never)
      setMaterialRequestSent(true)
      setMaterialRequestName('')
    } catch {
      // ignore
    } finally {
      setMaterialRequestSending(false)
    }
  }

  const handleSubmit = () => {
    if (!shopId || !name.trim()) {
      setError('アイテム名を入力してください')
      return
    }
    setError(null)

    createItem(
      {
        shopId,
        values: {
          itemCategoryId: selectedCategoryId,
          itemTypeId: selectedTypeId,
          brandId: selectedBrand?.id,
          name: name.trim(),
          description: description.trim() || undefined,
          sizes,
          materialTypeIds: Array.from(selectedMaterialIds),
          isAvailable,
        },
        photoFiles: photos.map((p) => p.file),
      },
      {
        onSuccess: () => navigate(`/owner/shops/${shopId}/items`),
        onError: (err) => setError(err instanceof Error ? err.message : '登録に失敗しました'),
      },
    )
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100dvh-56px)]">

      {/* ── Page header ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span className="font-headline font-black leading-none tracking-tighter text-white/[0.04]" style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}>
            NEW ITEM
          </span>
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="pb-6">
            <Link
              to={`/owner/shops/${shopId}/items`}
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              アイテム一覧へ
            </Link>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Owner</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              アイテムを登録
            </h1>
          </div>
        </div>
      </section>

      {/* ── Form ─────────────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl space-y-10 px-4 py-10 md:px-16 md:py-14">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-sm border border-red-200 bg-red-50 px-4 py-3">
              <p className="flex-1 text-xs font-medium text-red-700">{error}</p>
              <button onClick={() => setError(null)}><X className="h-3.5 w-3.5 text-red-400" /></button>
            </div>
          )}

          {/* ── 01 Item Category ─────────────────────── */}
          <section>
            <SectionLabel index="01" label="アイテムカテゴリ" note="任意" />
            <div className="flex flex-wrap gap-2">
              {(categories ?? []).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (selectedCategoryId === cat.id) {
                      setSelectedCategoryId(undefined)
                      setSelectedTypeId(undefined)
                    } else {
                      setSelectedCategoryId(cat.id)
                      setSelectedTypeId(undefined)
                    }
                  }}
                  className={cn(
                    'rounded-sm border px-4 py-2 text-xs font-bold transition-all',
                    selectedCategoryId === cat.id
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-white text-foreground/70 hover:border-primary/30',
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </section>

          {/* ── 02 Item Type ─────────────────────────── */}
          {selectedCategory && (
            <section>
              <SectionLabel index="02" label="アイテムタイプ" note="任意" />
              <div className="flex flex-wrap gap-2">
                {selectedCategory.types.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedTypeId((prev) => (prev === type.id ? undefined : type.id))}
                    className={cn(
                      'rounded-sm border px-3 py-1.5 text-xs font-bold transition-all',
                      selectedTypeId === type.id
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-white text-foreground/70 hover:border-primary/30',
                    )}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── 03 Brand ─────────────────────────────── */}
          <section>
            <SectionLabel index="03" label="ブランド" note="任意" />
            {selectedBrand ? (
              <div className="flex items-center gap-3 border border-primary/30 bg-primary/[0.03] px-4 py-3">
                <Tag className="h-3.5 w-3.5 text-primary/60" />
                <span className="flex-1 font-headline text-sm font-black tracking-tight">{selectedBrand.name}</span>
                <button
                  type="button"
                  onClick={() => { setSelectedBrand(null); setBrandQuery('') }}
                  className="text-muted-foreground/40 hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div ref={brandSearchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                  <input
                    type="text"
                    placeholder="ブランド名で検索…"
                    value={brandQuery}
                    onChange={(e) => { setBrandQuery(e.target.value); setBrandDropdownOpen(true) }}
                    onFocus={() => setBrandDropdownOpen(true)}
                    className="h-11 w-full border border-border bg-white pl-9 pr-4 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                {brandDropdownOpen && brandQuery.trim().length >= 2 && filteredBrands.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 border border-t-0 border-border bg-white editorial-shadow">
                    {filteredBrands.map((brand) => (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => { setSelectedBrand(brand); setBrandQuery(''); setBrandDropdownOpen(false) }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50"
                      >
                        <Tag className="h-3 w-3 text-muted-foreground/40" />
                        <span className="font-headline text-[12px] font-black tracking-tight">{brand.name}</span>
                        <Plus className="ml-auto h-3.5 w-3.5 text-primary/60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── 04 Name ──────────────────────────────── */}
          <section>
            <SectionLabel index="04" label="アイテム名" note="必須" />
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameManuallyEdited(true) }}
              placeholder="例: COMOLI コットンツイルシャツ"
              className="h-11 w-full border border-border bg-white px-4 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {!nameManuallyEdited && (
              <p className="mt-1.5 text-[10px] text-muted-foreground/40">
                ブランドやタイプを選ぶと自動入力されます。編集可能です。
              </p>
            )}
          </section>

          {/* ── 05 Description ───────────────────────── */}
          <section>
            <SectionLabel index="05" label="説明" note="任意" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="素材感、シルエット、着こなしのコツなどを自由に記入してください"
              rows={4}
              className="w-full border border-border bg-white px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </section>

          {/* ── 06 Sizes ─────────────────────────────── */}
          <section>
            <SectionLabel index="06" label="サイズ" note="任意" />
            <div className="flex gap-2">
              <input
                type="text"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSize() } }}
                placeholder="S, M, L, XL, 36, 38…"
                className="h-10 flex-1 border border-border bg-white px-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={addSize}
                className="h-10 border border-border bg-white px-3 text-xs font-bold text-muted-foreground/60 hover:text-foreground"
              >
                追加
              </button>
            </div>
            {sizes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sizes.map((s) => (
                  <span key={s} className="flex items-center gap-1 border border-border bg-white px-2 py-1 text-[11px] font-bold">
                    {s}
                    <button type="button" onClick={() => removeSize(s)} className="text-muted-foreground/30 hover:text-red-500">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* ── 07 Materials ─────────────────────────── */}
          <section>
            <SectionLabel index="07" label="素材" note="任意" />
            <div className="flex flex-wrap gap-2">
              {(materials ?? []).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMaterial(m.id)}
                  className={cn(
                    'rounded-sm border px-3 py-1.5 text-xs font-bold transition-all',
                    selectedMaterialIds.has(m.id)
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-white text-foreground/70 hover:border-primary/30',
                  )}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {/* Material request */}
            <div className="mt-4 border border-dashed border-border p-4">
              {!showMaterialRequest ? (
                <button
                  type="button"
                  onClick={() => setShowMaterialRequest(true)}
                  className="text-[11px] font-bold text-muted-foreground/50 hover:text-primary/60"
                >
                  欲しい素材が見つからない場合はリクエスト →
                </button>
              ) : materialRequestSent ? (
                <p className="text-[11px] font-bold text-primary/70">
                  リクエストを送信しました。ありがとうございます！
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">
                    素材追加リクエスト
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={materialRequestName}
                      onChange={(e) => setMaterialRequestName(e.target.value)}
                      placeholder="例: カシミヤ混、オーガニックコットン"
                      className="h-9 flex-1 border border-border bg-white px-3 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <button
                      type="button"
                      onClick={handleMaterialRequest}
                      disabled={!materialRequestName.trim() || materialRequestSending}
                      className="h-9 border border-primary bg-primary px-3 text-xs font-bold text-white disabled:opacity-40"
                    >
                      {materialRequestSending ? '送信中…' : '送信'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowMaterialRequest(false); setMaterialRequestName('') }}
                      className="h-9 border border-border bg-white px-2 text-muted-foreground/40 hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/40">
                    素材名を入力して送信してください。
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── 09 Photos ────────────────────────────── */}
          <section>
            <SectionLabel index="08" label="写真" note={`任意 (最大10枚 · ${photos.length}/10)`} />

            {photos.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {photos.map((p, idx) => (
                  <div key={p.url} className="group relative aspect-square overflow-hidden border border-border">
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-sm bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 rounded-sm bg-black/60 px-1 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-white">
                        メイン
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {photos.length < 10 && (
              <>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  multiple
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 border border-dashed border-border py-8 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50 transition-colors hover:border-primary/40 hover:text-primary/60"
                >
                  <ImagePlus className="h-4 w-4" />
                  写真を追加
                </button>
              </>
            )}
          </section>

          {/* ── 10 Availability ──────────────────────── */}
          <section>
            <SectionLabel index="09" label="公開設定" />
            <button
              type="button"
              onClick={() => setIsAvailable((prev) => !prev)}
              className={cn(
                'flex w-full items-center justify-between border px-4 py-3 transition-all',
                isAvailable ? 'border-primary/20 bg-primary/[0.03]' : 'border-border bg-white',
              )}
            >
              <div className="text-left">
                <p className="text-xs font-bold">{isAvailable ? '公開中' : '非公開'}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                  {isAvailable ? 'ショップページでこのアイテムが表示されます' : '登録後に公開することができます'}
                </p>
              </div>
              <div className={cn(
                'h-5 w-9 rounded-full transition-colors',
                isAvailable ? 'bg-primary' : 'bg-muted-foreground/20',
              )}>
                <div className={cn(
                  'h-5 w-5 rounded-full bg-white shadow transition-transform',
                  isAvailable ? 'translate-x-4' : 'translate-x-0',
                )} />
              </div>
            </button>
          </section>

          {/* ── Submit ────────────────────────────────── */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/owner/shops/${shopId}/items`)}
              className="flex-1 border border-border bg-white py-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isCreating || !name.trim()}
              className="flex-1 bg-primary py-3 text-xs font-bold uppercase tracking-[0.2em] text-white disabled:opacity-50"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  登録中...
                </span>
              ) : '登録する'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Section label component ────────────────────────────────────

const SectionLabel = ({ index, label, note }: { index: string; label: string; note?: string }) => (
  <div className="mb-4 flex items-baseline gap-3">
    <span className="font-headline text-[9px] font-black tabular-nums text-muted-foreground/25">{index}</span>
    <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
      {label}
    </span>
    {note && <span className="text-[9px] text-muted-foreground/30">{note}</span>}
    <span className="h-px flex-1 bg-border" />
  </div>
)

export default ShopItemNewPage
