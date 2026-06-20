import { useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Globe, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useShop } from '@/hooks/useShop'
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

const useAdminUpdateShop = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      shopId,
      categoryIds,
      businessHours,
      ...fields
    }: ShopFormValues & { shopId: string }) => {
      const closedDays = DAYS
        .filter((d) => !businessHours[d.key].enabled)
        .map((d) => d.key)

      const { error: shopError } = await supabase
        .from('shops')
        .update({
          name:           fields.name,
          description:    fields.description || null,
          prefecture_id:  fields.prefectureId,
          city_id:        fields.cityId ?? null,
          address:        fields.address || null,
          price_range_id: fields.priceRangeId ?? null,
          phone:          fields.phone || null,
          website_url:    fields.websiteUrl || null,
          instagram_url:  fields.instagramUrl || null,
          twitter_url:    fields.twitterUrl || null,
          tiktok_url:     fields.tiktokUrl || null,
          status:         fields.status,
          business_hours: toBusinessHours(businessHours),
          closed_days:    closedDays,
        } as never)
        .eq('id', shopId) as unknown as { error: { message: string } | null }

      if (shopError) throw new Error(shopError.message)

      const { error: delError } = await supabase
        .from('shop_categories')
        .delete()
        .eq('shop_id', shopId) as unknown as { error: { message: string } | null }

      if (delError) throw new Error(delError.message)

      const { error: insError } = await supabase
        .from('shop_categories')
        .insert(categoryIds.map((id) => ({ shop_id: shopId, category_id: id })) as never) as unknown as {
          error: { message: string } | null
        }

      if (insError) throw new Error(insError.message)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
      queryClient.invalidateQueries({ queryKey: ['shop', variables.shopId] })
    },
  })
}

const AdminShopEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useUiStore()

  const { data: shop, isLoading: shopLoading } = useShop(id ?? '')
  const { data: masterData } = useShopMasterData()
  const { mutate, isPending, error } = useAdminUpdateShop()

  const methods = useForm<ShopFormValues>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: DEFAULT_SHOP_FORM_VALUES,
  })

  const initializedShopId = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (shop && masterData && shop.id !== initializedShopId.current) {
      initializedShopId.current = shop.id
      methods.reset(shopToFormValues(shop))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop, masterData])

  const onSubmit = (values: ShopFormValues) => {
    if (!id) return
    mutate(
      { ...values, shopId: id },
      {
        onSuccess: () => {
          addToast({ title: '変更を保存しました', variant: 'default', position: 'bottom-right' })
        },
      },
    )
  }

  if (shopLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="font-headline text-2xl font-black tracking-tight text-muted-foreground">SHOP NOT FOUND</p>
        <button
          onClick={() => navigate('/admin/shops')}
          className="text-xs font-bold uppercase tracking-[0.3em] text-primary underline-offset-2 hover:underline"
        >
          ← 店舗管理に戻る
        </button>
      </div>
    )
  }

  return (
    <ShopForm
      methods={methods}
      mode="edit"
      showStatus
      showBusinessHours
      showSidebar
      masterData={masterData}
      photoSlot={id ? <ShopPhotoSection shopId={id} num="05" animationDelay="100ms" /> : undefined}
      sidebarChildren={
        <div className="border border-border bg-white editorial-shadow">
          <Link
            to={`/admin/shops/${id}/brands`}
            className="flex items-center gap-3 border-b border-border/60 px-4 py-3 transition-colors hover:bg-muted/30"
          >
            <Tag className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
              ブランド管理
            </span>
          </Link>
          <a
            href={`/shops/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
              公開ページ
            </span>
          </a>
        </div>
      }
      onSubmit={onSubmit}
      isPending={isPending}
      errorMessage={error ? (error as Error).message : undefined}
      headerProps={{
        backgroundText: 'EDIT',
        context: 'admin',
        backLabel: '店舗管理',
        backLink: '/admin/shops',
        title: '店舗編集',
        subtitle: shop.name,
        headerRight: (
          <a
            href={`/shops/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white/70"
          >
            <ExternalLink className="h-3 w-3" />
            店舗ページ
          </a>
        ),
      }}
    />
  )
}

export default AdminShopEditPage
