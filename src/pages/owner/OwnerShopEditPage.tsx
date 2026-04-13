import { useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Globe, Tag } from 'lucide-react'
import { useShop } from '@/hooks/useShop'
import { useUpdateShop } from '@/hooks/useOwnerShops'
import { useShopMasterData } from '@/hooks/useShopMasterData'
import { useUiStore } from '@/store/uiStore'
import { ShopPhotoSection } from '@/components/shop/ShopPhotoSection'
import { DAYS, toBusinessHours } from '@/components/shop/ShopBusinessHoursSection'
import { ShopForm } from '@/components/shop/form/ShopForm'
import {
  shopFormSchema,
  DEFAULT_SHOP_FORM_VALUES,
  shopToFormValues,
  type ShopFormValues,
} from '@/components/shop/form/shopFormSchema'

const OwnerShopEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: shop, isLoading } = useShop(id ?? '')
  const { mutate, isPending } = useUpdateShop()
  const { data: masterData } = useShopMasterData()
  const { addToast } = useUiStore()

  const methods = useForm<ShopFormValues>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: DEFAULT_SHOP_FORM_VALUES,
  })

  useEffect(() => {
    if (shop) methods.reset(shopToFormValues(shop))
  }, [shop, methods])

  const onSubmit = (values: ShopFormValues) => {
    if (!id) return
    const closedDays = DAYS
      .filter((d) => !values.businessHours[d.key].enabled)
      .map((d) => d.key)

    mutate(
      {
        shopId:        id,
        name:          values.name,
        description:   values.description,
        prefectureId:  values.prefectureId,
        cityId:        values.cityId ?? null,
        address:       values.address,
        priceRangeId:  values.priceRangeId ?? null,
        categoryIds:   values.categoryIds,
        phone:         values.phone,
        websiteUrl:    values.websiteUrl,
        instagramUrl:  values.instagramUrl,
        twitterUrl:    values.twitterUrl,
        tiktokUrl:     values.tiktokUrl,
        businessHours: toBusinessHours(values.businessHours),
        closedDays,
      },
      {
        onSuccess: () => {
          methods.reset(values)
          addToast({ title: '変更を保存しました', variant: 'default', position: 'bottom-right' })
        },
        onError: (err) => {
          addToast({ title: (err as Error).message || '保存に失敗しました', variant: 'destructive', position: 'bottom-right' })
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <ShopForm
      methods={methods}
      mode="edit"
      showStatus={false}
      showBusinessHours
      showSidebar
      showDescriptionCounter
      masterData={masterData}
      photoSlot={id ? <ShopPhotoSection shopId={id} num="05" animationDelay="100ms" /> : undefined}
      sidebarChildren={
        <div className="border border-border bg-white editorial-shadow">
          <Link
            to={`/owner/shops/${id}/brands`}
            className="flex items-center gap-3 border-b border-border/60 px-4 py-3 transition-colors hover:bg-muted/30"
          >
            <Tag className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
              ブランド管理
            </span>
          </Link>
          <Link
            to={`/shops/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
              公開ページ
            </span>
          </Link>
        </div>
      }
      onSubmit={onSubmit}
      isPending={isPending}
      headerProps={{
        backgroundText: 'EDIT',
        context: 'owner',
        backLabel: 'ダッシュボード',
        backLink: '/owner',
        title: isLoading ? '' : (shop?.name ?? 'SHOP EDIT'),
      }}
    />
  )
}

export default OwnerShopEditPage
