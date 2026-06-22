import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { isServiceRoleRequest } from '../_shared/guards.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ItemRow {
  id: string
  shop_id: string
  name: string
  price: number | null
  size_ids: number[]
  item_type_id: number | null
  brand_id: string | null
  is_available: boolean
  item_types: { id: number; name: string; item_category_id: number } | null
  brands: { name: string } | null
  shops: { name: string; status: string; prefecture_id: number | null; created_by: string | null; prefectures: { name: string } | null } | null
}

interface WishRow {
  user_id: string
  item_type_id: number | null
  item_category_id: number | null
  brand_id: string | null
  size_id: number | null
  price_range_id: number
  price_ranges: { min_price: number | null; max_price: number | null } | null
}

function buildEmailHtml(params: {
  itemName: string
  shopName: string
  prefecture: string
  brandName: string
  priceText: string
  sizeText: string
  itemUrl: string
  wishListUrl: string
}): string {
  const { itemName, shopName, prefecture, brandName, priceText, sizeText, itemUrl, wishListUrl } = params

  const detailRow = (label: string, value: string) =>
    value
      ? `<td style="padding:0 20px 0 0;vertical-align:top;">
           <p style="margin:0 0 4px;font-size:9px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;color:#9ca3af;">${label}</p>
           <p style="margin:0;font-size:13px;font-weight:600;color:#374151;">${value}</p>
         </td>`
      : ''

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header -->
        <tr><td style="background:#1c1d2b;padding:32px 40px;">
          <p style="margin:0;font-size:10px;font-weight:900;letter-spacing:0.5em;text-transform:uppercase;color:rgba(255,255,255,0.35);">SELECT SHOP NAVIGATOR</p>
          <p style="margin:8px 0 0;font-size:28px;font-weight:900;letter-spacing:-0.04em;color:#fff;">FINDE</p>
        </td></tr>

        <!-- Accent line -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#1c1d2b 0%,#4a4b6a 100%);"></td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:48px 40px;">
          <p style="margin:0 0 4px;font-size:9px;font-weight:900;letter-spacing:0.45em;text-transform:uppercase;color:#9ca3af;">— Wish Match</p>
          <h1 style="margin:0 0 32px;font-size:22px;font-weight:900;letter-spacing:-0.03em;color:#1c1d2b;line-height:1.2;">ウィッシュにマッチする<br>アイテムが見つかりました</h1>
          <div style="width:32px;height:2px;background:#1c1d2b;margin-bottom:32px;"></div>

          <!-- Item detail box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-left:3px solid #1c1d2b;margin-bottom:32px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 4px;font-size:9px;font-weight:900;letter-spacing:0.4em;text-transform:uppercase;color:#9ca3af;">Item</p>
              <p style="margin:0 0 4px;font-size:18px;font-weight:900;letter-spacing:-0.02em;color:#1c1d2b;">${itemName}</p>
              <p style="margin:0 0 20px;font-size:12px;font-weight:600;color:#6b7280;">${shopName}${prefecture ? ` ・ ${prefecture}` : ''}</p>

              <table cellpadding="0" cellspacing="0">
                <tr>
                  ${detailRow('ブランド', brandName)}
                  ${detailRow('価格', priceText)}
                  ${detailRow('サイズ', sizeText)}
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;">
                <a href="${itemUrl}" style="display:inline-block;background:#1c1d2b;color:#fff;font-size:11px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">
                  アイテムを見る →
                </a>
              </td>
              <td>
                <a href="${wishListUrl}" style="display:inline-block;border:1px solid #d1d5db;color:#374151;font-size:11px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">
                  ウィッシュ一覧
                </a>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f4f4f0;padding:24px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 6px;font-size:10px;color:#9ca3af;line-height:1.7;">このメールはウィッシュリストのメール通知が有効になっているため送信されています。</p>
          <p style="margin:0;font-size:10px;line-height:1.7;"><a href="${wishListUrl}" style="color:#6b7280;text-decoration:underline;">ウィッシュリストの設定</a>からメール通知をオフにすることができます。</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // この関数は不特定多数へメールを一斉送信するため、DB トリガー等の
  // 内部呼び出し（サービスロールキー）からのみ実行を許可する。
  if (!isServiceRoleRequest(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail    = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'
    const siteUrl      = Deno.env.get('SITE_URL') ?? 'https://finde.example.com'

    if (!resendApiKey) throw new Error('RESEND_API_KEY is not set')

    const { item_id } = await req.json() as { item_id: string }
    if (!item_id) throw new Error('item_id is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // アイテム情報を取得
    const { data: item, error: itemErr } = await supabase
      .from('shop_items')
      .select(`
        id, shop_id, name, price, size_ids, item_type_id, brand_id, is_available,
        item_types ( id, name, item_category_id ),
        brands ( name ),
        shops ( name, status, prefecture_id, created_by, prefectures ( name ) )
      `)
      .eq('id', item_id)
      .single() as { data: ItemRow | null; error: { message: string } | null }

    if (itemErr || !item) throw new Error(itemErr?.message ?? 'Item not found')

    const shop = item.shops
    if (!shop || shop.status !== 'public' || !item.is_available || shop.prefecture_id == null) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const itemCategoryId = item.item_types?.item_category_id ?? null

    // notify_email = true のマッチするウィッシュを取得
    // 種別: item_type 一致 OR（item_type未指定 AND item_category 一致）OR（両 null）
    let wishQuery = supabase
      .from('wishes')
      .select('user_id, item_type_id, item_category_id, brand_id, size_id, price_range_id, price_ranges ( min_price, max_price )')
      .eq('status', 'active')
      .eq('notify_email', true)
      .eq('prefecture_id', shop.prefecture_id)

    if (shop.created_by) wishQuery = wishQuery.neq('user_id', shop.created_by)

    const { data: wishes } = await wishQuery as { data: WishRow[] | null }

    const eligibleUserIds = new Set<string>()
    for (const w of wishes ?? []) {
      // 種別
      const typeOk =
        (w.item_type_id != null && w.item_type_id === item.item_type_id) ||
        (w.item_type_id == null && w.item_category_id != null && w.item_category_id === itemCategoryId) ||
        (w.item_type_id == null && w.item_category_id == null)
      if (!typeOk) continue

      // ブランド
      if (w.brand_id != null && w.brand_id !== item.brand_id) continue

      // サイズ
      if (w.size_id != null && !item.size_ids.includes(w.size_id)) continue

      // 価格（item.price が null ならスキップ）
      if (item.price != null) {
        const wMin = w.price_ranges?.min_price ?? 0
        const wMax = w.price_ranges?.max_price ?? 2147483647
        if (item.price < wMin || item.price > wMax) continue
      }

      eligibleUserIds.add(w.user_id)
    }

    if (eligibleUserIds.size === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // サイズラベル（任意・表示用）
    const { data: sizeRows } = await supabase
      .from('sizes')
      .select('id, label')
      .in('id', item.size_ids.length > 0 ? item.size_ids : [-1]) as { data: { id: number; label: string }[] | null }

    const sizeText  = (sizeRows ?? []).map((s) => s.label).join(' / ')
    const brandName = item.brands?.name ?? ''
    const priceText = item.price != null ? `¥${item.price.toLocaleString()}` : ''
    const prefecture = shop.prefectures?.name ?? ''

    const itemUrl     = `${siteUrl}/shops/${item.shop_id}/items/${item.id}`
    const wishListUrl = `${siteUrl}/wishes`

    let sentCount = 0
    for (const userId of eligibleUserIds) {
      const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(userId)
      if (userErr || !user?.email) continue

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from:    fromEmail,
          to:      user.email,
          subject: `【FINDE】ウィッシュにマッチするアイテムが見つかりました`,
          html: buildEmailHtml({
            itemName: item.name,
            shopName: shop.name,
            prefecture,
            brandName,
            priceText,
            sizeText,
            itemUrl,
            wishListUrl,
          }),
        }),
      })

      if (res.ok) sentCount++
      else console.warn(`[send-wish-match-email] Resend error for ${user.email}:`, await res.text())
    }

    return new Response(JSON.stringify({ ok: true, sent: sentCount }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-wish-match-email]', err)
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
