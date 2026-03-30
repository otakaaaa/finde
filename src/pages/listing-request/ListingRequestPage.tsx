import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Category } from '@/types'

const listingRequestSchema = z.object({
  shopName: z.string().min(1, '店舗名を入力してください').max(100),
  address: z.string().max(200).optional(),
  categoryIds: z.array(z.number()).min(1, 'カテゴリを1つ以上選択してください'),
  websiteUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  note: z.string().max(500).optional(),
  isOwnerRequest: z.boolean(),
})

type ListingRequestFormValues = z.infer<typeof listingRequestSchema>

const ListingRequestPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [submitted, setSubmitted] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, code, name').order('id') as {
        data: Category[] | null; error: unknown
      }
      return data ?? []
    },
    staleTime: Infinity,
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (values: ListingRequestFormValues) => {
      if (!user) throw new Error('ログインが必要です')

      const { error } = await supabase.from('shop_listing_requests').insert({
        submitted_by: user.id,
        shop_name: values.shopName,
        address: values.address || null,
        category_ids: values.categoryIds,
        website_url: values.websiteUrl || null,
        note: values.note || null,
        is_owner_request: values.isOwnerRequest,
      } as never) as unknown as { data: unknown; error: { message: string } | null }

      if (error) throw new Error(error.message)
    },
    onSuccess: () => setSubmitted(true),
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ListingRequestFormValues>({
    resolver: zodResolver(listingRequestSchema),
    defaultValues: { categoryIds: [], isOwnerRequest: false },
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

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Alert>
          <AlertDescription>
            掲載申請を受け付けました。審査完了後、メールでご連絡いたします。
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
          トップページへ
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">店舗の掲載申請</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        フクナビに掲載したい店舗を申請してください。スタッフが確認後、掲載いたします。
      </p>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="shopName">店舗名 *</Label>
          <Input id="shopName" placeholder="例: ○○古着店" {...register('shopName')} />
          {errors.shopName && <p className="text-xs text-red-600">{errors.shopName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">住所（任意）</Label>
          <Input id="address" placeholder="例: 東京都渋谷区..." {...register('address')} />
        </div>

        <div className="space-y-2">
          <Label>カテゴリ *（複数選択可）</Label>
          <div className="flex flex-wrap gap-2">
            {categories?.map((cat) => (
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

        <div className="space-y-2">
          <Label htmlFor="websiteUrl">公式サイトURL（任意）</Label>
          <Input id="websiteUrl" type="url" placeholder="https://example.com" {...register('websiteUrl')} />
          {errors.websiteUrl && <p className="text-xs text-red-600">{errors.websiteUrl.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">備考（任意）</Label>
          <textarea
            id="note"
            rows={3}
            className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 resize-none"
            {...register('note')}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('isOwnerRequest')} className="h-4 w-4" />
          この店舗のオーナーとして申請する（オーナー審査を行います）
        </label>

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? '送信中...' : '申請を送信'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ListingRequestPage
