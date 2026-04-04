import { useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft } from 'lucide-react'
import { useShop } from '@/hooks/useShop'
import { useUpdateShop } from '@/hooks/useOwnerShops'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const shopEditSchema = z.object({
  description: z.string().max(2000, '2000文字以内で入力してください').optional(),
  phone: z.string().max(20).optional(),
  websiteUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  instagramUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  twitterUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
})

type ShopEditFormValues = z.infer<typeof shopEditSchema>

const ShopEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: shop, isLoading } = useShop(id ?? '')
  const { mutate, isPending, error, isSuccess } = useUpdateShop()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ShopEditFormValues>({
    resolver: zodResolver(shopEditSchema),
  })

  useEffect(() => {
    if (shop) {
      reset({
        description: shop.description ?? '',
        phone: shop.phone ?? '',
        websiteUrl: shop.websiteUrl ?? '',
        instagramUrl: shop.instagramUrl ?? '',
        twitterUrl: shop.twitterUrl ?? '',
      })
    }
  }, [shop, reset])

  const onSubmit = (values: ShopEditFormValues) => {
    if (!id) return
    mutate({
      shopId: id,
      description: values.description,
      phone: values.phone,
      websiteUrl: values.websiteUrl,
      instagramUrl: values.instagramUrl,
      twitterUrl: values.twitterUrl,
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        to="/owner"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        ダッシュボードへ戻る
      </Link>

      <h1 className="mb-2 text-2xl font-bold">{shop?.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">店舗情報を編集できます</p>

      {isSuccess && (
        <Alert className="mb-4">
          <AlertDescription>保存しました</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="description">店舗説明</Label>
          <textarea
            id="description"
            rows={6}
            placeholder="店舗の特徴やコンセプトをご紹介ください"
            className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 resize-none"
            {...register('description')}
          />
          {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">電話番号</Label>
          <Input id="phone" type="tel" placeholder="03-0000-0000" {...register('phone')} />
        </div>

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

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? '保存中...' : '変更を保存'}
          </Button>
          <Button asChild variant="outline">
            <Link to={`/owner/shops/${id}/brands`}>ブランド管理</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ShopEditPage
