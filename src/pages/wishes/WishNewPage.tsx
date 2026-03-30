import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCreateWish } from '@/hooks/useWishes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Area, Category, PriceRange } from '@/types'

const wishSchema = z.object({
  type: z.enum(['brand', 'item', 'condition']),
  categoryId: z.number({ required_error: 'カテゴリを選択してください' }),
  priceRangeId: z.number({ required_error: '価格帯を選択してください' }),
  areaId: z.number({ required_error: 'エリアを選択してください' }),
  size: z.string().optional(),
  note: z.string().max(500, '500文字以内で入力してください').optional(),
  condition: z.enum(['new', 'used']).optional(),
  urgency: z.enum(['low', 'medium', 'high']).optional(),
  isPublic: z.boolean(),
  notifyEmail: z.boolean(),
})

type WishFormSchema = z.infer<typeof wishSchema>

const WishNewPage = () => {
  const navigate = useNavigate()
  const { mutate, isPending, error } = useCreateWish()

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

  const { register, handleSubmit, formState: { errors } } = useForm<WishFormSchema>({
    resolver: zodResolver(wishSchema),
    defaultValues: { type: 'brand', isPublic: true, notifyEmail: true },
  })

  const onSubmit = (values: WishFormSchema) => {
    mutate(values, {
      onSuccess: () => navigate('/wishes'),
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">ウィッシュを追加</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">タイプ</Label>
          <select
            id="type"
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...register('type')}
          >
            <option value="brand">ブランド</option>
            <option value="item">アイテム</option>
            <option value="condition">コンディション</option>
          </select>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="categoryId">カテゴリ *</Label>
          <select
            id="categoryId"
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...register('categoryId', { valueAsNumber: true })}
          >
            <option value="">選択してください</option>
            {masterData?.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="text-xs text-red-600">{errors.categoryId.message}</p>}
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <Label htmlFor="priceRangeId">価格帯 *</Label>
          <select
            id="priceRangeId"
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...register('priceRangeId', { valueAsNumber: true })}
          >
            <option value="">選択してください</option>
            {masterData?.priceRanges.map((pr) => (
              <option key={pr.id} value={pr.id}>{pr.label}</option>
            ))}
          </select>
          {errors.priceRangeId && <p className="text-xs text-red-600">{errors.priceRangeId.message}</p>}
        </div>

        {/* Area */}
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

        {/* Size */}
        <div className="space-y-2">
          <Label htmlFor="size">サイズ（任意）</Label>
          <Input id="size" placeholder="例: M, 175cm, 28inch" {...register('size')} />
        </div>

        {/* Condition */}
        <div className="space-y-2">
          <Label htmlFor="condition">コンディション（任意）</Label>
          <select
            id="condition"
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...register('condition')}
          >
            <option value="">指定なし</option>
            <option value="new">新品</option>
            <option value="used">中古</option>
          </select>
        </div>

        {/* Urgency */}
        <div className="space-y-2">
          <Label htmlFor="urgency">優先度（任意）</Label>
          <select
            id="urgency"
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...register('urgency')}
          >
            <option value="">指定なし</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="note">メモ（任意）</Label>
          <textarea
            id="note"
            rows={3}
            placeholder="探しているアイテムの詳細など"
            className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 resize-none"
            {...register('note')}
          />
          {errors.note && <p className="text-xs text-red-600">{errors.note.message}</p>}
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('isPublic')} className="h-4 w-4" />
            ウィッシュを公開する（他のユーザーに見せる）
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('notifyEmail')} className="h-4 w-4" />
            マッチする店舗が見つかったらメール通知を受け取る
          </label>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? '保存中...' : '保存する'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/wishes')}>
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  )
}

export default WishNewPage
