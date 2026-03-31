import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Area, Category, PriceRange } from '@/types'

const shopSchema = z.object({
  name: z.string().min(1, '店舗名を入力してください').max(100),
  description: z.string().max(2000).optional(),
  areaId: z.number({ required_error: 'エリアを選択してください' }),
  priceRangeId: z.number().optional(),
  categoryIds: z.array(z.number()).min(1, 'カテゴリを1つ以上選択してください'),
  phone: z.string().max(20).optional(),
  websiteUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  instagramUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  twitterUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  status: z.enum(['public', 'private', 'pending']),
})

type ShopFormValues = z.infer<typeof shopSchema>

const AdminShopNewPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: masterData } = useQuery({
    queryKey: ['master-data'],
    queryFn: async () => {
      const [areas, categories, priceRanges] = await Promise.all([
        supabase.from('areas').select('id, prefecture, city, slug').order('id') as unknown as Promise<{ data: Area[] | null; error: unknown }>,
        supabase.from('categories').select('id, code, name').order('id') as unknown as Promise<{ data: Category[] | null; error: unknown }>,
        supabase.from('price_ranges').select('id, label, min_price, max_price').order('id') as unknown as Promise<{ data: ({ id: number; label: string; min_price: number | null; max_price: number | null })[] | null; error: unknown }>,
      ])
      return {
        areas: areas.data ?? [],
        categories: categories.data ?? [],
        priceRanges: (priceRanges.data ?? []).map((p) => ({ id: p.id, label: p.label, minPrice: p.min_price, maxPrice: p.max_price })) as PriceRange[],
      }
    },
    staleTime: Infinity,
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (values: ShopFormValues) => {
      if (!user) throw new Error('ログインが必要です')

      // 店舗を作成
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          name: values.name,
          description: values.description || null,
          area_id: values.areaId,
          price_range_id: values.priceRangeId ?? null,
          phone: values.phone || null,
          website_url: values.websiteUrl || null,
          instagram_url: values.instagramUrl || null,
          twitter_url: values.twitterUrl || null,
          status: values.status,
          created_by: user.id,
        } as never)
        .select('id')
        .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

      if (shopError) throw new Error(shopError.message)
      if (!shop) throw new Error('店舗の作成に失敗しました')

      // カテゴリを紐付け
      const categoryRows = values.categoryIds.map((categoryId) => ({
        shop_id: shop.id,
        category_id: categoryId,
      }))
      const { error: catError } = await supabase
        .from('shop_categories')
        .insert(categoryRows as never) as unknown as { error: { message: string } | null }

      if (catError) throw new Error(catError.message)

      return shop.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
      navigate('/admin/shops')
    },
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: { categoryIds: [], status: 'public' },
  })

  const selectedCategories = watch('categoryIds')

  const toggleCategory = (id: number) => {
    const current = selectedCategories ?? []
    setValue(
      'categoryIds',
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
      { shouldValidate: true }
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button
        onClick={() => navigate('/admin/shops')}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        店舗管理に戻る
      </button>

      <h1 className="mb-6 text-2xl font-bold">店舗を新規登録</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-5">
        {/* 店舗名 */}
        <div className="space-y-2">
          <Label htmlFor="name">店舗名 *</Label>
          <Input id="name" placeholder="例: ○○古着店" {...register('name')} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>

        {/* カテゴリ */}
        <div className="space-y-2">
          <Label>カテゴリ *（複数選択可）</Label>
          <div className="flex flex-wrap gap-2">
            {masterData?.categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  selectedCategories?.includes(cat.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-white hover:bg-muted'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          {errors.categoryIds && <p className="text-xs text-red-600">{errors.categoryIds.message}</p>}
        </div>

        {/* エリア */}
        <div className="space-y-2">
          <Label htmlFor="areaId">エリア *</Label>
          <select
            id="areaId"
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...register('areaId', { valueAsNumber: true })}
          >
            <option value="">選択してください</option>
            {masterData?.areas.map((area) => (
              <option key={area.id} value={area.id}>{area.city}</option>
            ))}
          </select>
          {errors.areaId && <p className="text-xs text-red-600">{errors.areaId.message}</p>}
        </div>

        {/* 価格帯 */}
        <div className="space-y-2">
          <Label htmlFor="priceRangeId">価格帯</Label>
          <select
            id="priceRangeId"
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...register('priceRangeId', { valueAsNumber: true })}
          >
            <option value="">指定なし</option>
            {masterData?.priceRanges.map((pr) => (
              <option key={pr.id} value={pr.id}>{pr.label}</option>
            ))}
          </select>
        </div>

        {/* 説明 */}
        <div className="space-y-2">
          <Label htmlFor="description">店舗説明</Label>
          <textarea
            id="description"
            rows={4}
            className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 resize-none"
            {...register('description')}
          />
          {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
        </div>

        {/* 電話番号 */}
        <div className="space-y-2">
          <Label htmlFor="phone">電話番号</Label>
          <Input id="phone" type="tel" placeholder="03-0000-0000" {...register('phone')} />
        </div>

        {/* URL */}
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">公式サイトURL</Label>
          <Input id="websiteUrl" type="url" placeholder="https://example.com" {...register('websiteUrl')} />
          {errors.websiteUrl && <p className="text-xs text-red-600">{errors.websiteUrl.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagramUrl">Instagram URL</Label>
          <Input id="instagramUrl" type="url" placeholder="https://instagram.com/..." {...register('instagramUrl')} />
          {errors.instagramUrl && <p className="text-xs text-red-600">{errors.instagramUrl.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitterUrl">X URL</Label>
          <Input id="twitterUrl" type="url" placeholder="https://twitter.com/..." {...register('twitterUrl')} />
          {errors.twitterUrl && <p className="text-xs text-red-600">{errors.twitterUrl.message}</p>}
        </div>

        {/* ステータス */}
        <div className="space-y-2">
          <Label htmlFor="status">公開ステータス</Label>
          <select
            id="status"
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...register('status')}
          >
            <option value="public">公開</option>
            <option value="pending">審査中</option>
            <option value="private">非公開</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? '登録中...' : '店舗を登録'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/shops')}>
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AdminShopNewPage
