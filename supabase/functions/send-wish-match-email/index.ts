import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShopRow {
  name: string
  area_id: number | null
  price_range_id: number | null
  areas: { prefecture: string; city: string } | null
  price_ranges: { label: string; min_price: number | null; max_price: number | null } | null
  shop_categories: { categories: { name: string } | null }[]
}

interface WishUserRow {
  user_id: string
}

function buildEmailHtml(params: {
  shopName: string
  prefecture: string
  city: string
  priceLabel: string
  categoryNames: string[]
  shopUrl: string
  wishListUrl: string
}): string {
  const { shopName, prefecture, city, priceLabel, categoryNames, shopUrl, wishListUrl } = params
  const categoryText = categoryNames.join(' / ')

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
          <h1 style="margin:0 0 32px;font-size:22px;font-weight:900;letter-spacing:-0.03em;color:#1c1d2b;line-height:1.2;">ウィッシュリストに<br>マッチする店舗が<br>見つかりました</h1>
          <div style="width:32px;height:2px;background:#1c1d2b;margin-bottom:32px;"></div>

          <!-- Shop detail box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-left:3px solid #1c1d2b;margin-bottom:32px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 4px;font-size:9px;font-weight:900;letter-spacing:0.4em;text-transform:uppercase;color:#9ca3af;">Shop</p>
              <p style="margin:0 0 20px;font-size:18px;font-weight:900;letter-spacing:-0.02em;color:#1c1d2b;">${shopName}</p>

              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 20px 0 0;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:9px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;color:#9ca3af;">エリア</p>
                    <p style="margin:0;font-size:13px;font-weight:600;color:#374151;">${prefecture} ${city}</p>
                  </td>
                  <td style="padding:0 20px 0 0;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:9px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;color:#9ca3af;">価格帯</p>
                    <p style="margin:0;font-size:13px;font-weight:600;color:#374151;">${priceLabel}</p>
                  </td>
                  ${categoryText ? `<td style="vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:9px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;color:#9ca3af;">カテゴリ</p>
                    <p style="margin:0;font-size:13px;font-weight:600;color:#374151;">${categoryText}</p>
                  </td>` : ''}
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;">
                <a href="${shopUrl}" style="display:inline-block;background:#1c1d2b;color:#fff;font-size:11px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">
                  店舗を見る →
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

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail    = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'
    const siteUrl      = Deno.env.get('SITE_URL') ?? 'https://finde.example.com'

    if (!resendApiKey) throw new Error('RESEND_API_KEY is not set')

    const { shop_id } = await req.json() as { shop_id: string }
    if (!shop_id) throw new Error('shop_id is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 店舗情報を取得
    const { data: shop, error: shopErr } = await supabase
      .from('shops')
      .select(`
        name, area_id, price_range_id,
        areas ( prefecture, city ),
        price_ranges ( label, min_price, max_price ),
        shop_categories ( categories ( name ) )
      `)
      .eq('id', shop_id)
      .single() as { data: ShopRow | null; error: { message: string } | null }

    if (shopErr || !shop) throw new Error(shopErr?.message ?? 'Shop not found')

    const prefecture     = shop.areas?.prefecture ?? ''
    const city           = shop.areas?.city ?? ''
    const priceLabel     = shop.price_ranges?.label ?? ''
    const shopPriceMin   = shop.price_ranges?.min_price ?? 0
    const shopPriceMax   = shop.price_ranges?.max_price ?? 2147483647
    const categoryNames  = shop.shop_categories
      .map((sc) => sc.categories?.name)
      .filter((n): n is string => !!n)
    const categoryIds    = shop.shop_categories.map((_, i) => i) // placeholder

    // notify_email = true のウィッシュを持つユーザーを取得
    // （トリガーと同じ条件: カテゴリ × 都道府県 × 価格帯オーバーラップ × active）
    const { data: shopCats } = await supabase
      .from('shop_categories')
      .select('category_id')
      .eq('shop_id', shop_id) as { data: { category_id: number }[] | null }

    const catIds = shopCats?.map((c) => c.category_id) ?? []
    if (catIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 都道府県内の area_id 一覧
    const { data: areaRows } = await supabase
      .from('areas')
      .select('id')
      .eq('prefecture', prefecture) as { data: { id: number }[] | null }

    const prefAreaIds = areaRows?.map((a) => a.id) ?? []
    if (prefAreaIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 価格帯オーバーラップするウィッシュユーザーを取得
    const { data: wishUsers } = await supabase
      .from('wishes')
      .select('user_id')
      .in('category_id', catIds)
      .in('area_id', prefAreaIds)
      .eq('status', 'active')
      .eq('notify_email', true) as { data: WishUserRow[] | null }

    if (!wishUsers || wishUsers.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 価格帯オーバーラップ確認はクライアントサイドで（Supabase はrange比較クエリが複雑なため）
    const { data: wishPriceRows } = await supabase
      .from('wishes')
      .select('user_id, price_range_id, price_ranges(min_price, max_price)')
      .in('user_id', wishUsers.map((w) => w.user_id))
      .in('category_id', catIds)
      .in('area_id', prefAreaIds)
      .eq('status', 'active')
      .eq('notify_email', true) as {
        data: {
          user_id: string
          price_range_id: number
          price_ranges: { min_price: number | null; max_price: number | null } | null
        }[] | null
      }

    const eligibleUserIds = new Set<string>(
      (wishPriceRows ?? [])
        .filter((w) => {
          const wMin = w.price_ranges?.min_price ?? 0
          const wMax = w.price_ranges?.max_price ?? 2147483647
          return wMin <= shopPriceMax && wMax >= shopPriceMin
        })
        .map((w) => w.user_id),
    )

    if (eligibleUserIds.size === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ユーザーのメールアドレスを取得してメール送信
    let sentCount = 0
    const shopUrl     = `${siteUrl}/shops/${shop_id}`
    const wishListUrl = `${siteUrl}/wishes`

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
          subject: `【FINDE】ウィッシュリストにマッチする店舗が見つかりました`,
          html: buildEmailHtml({
            shopName: shop.name,
            prefecture,
            city,
            priceLabel,
            categoryNames,
            shopUrl,
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
