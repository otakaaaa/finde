import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { isServiceRoleRequest } from '../_shared/guards.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnnouncementRow {
  id: string
  shop_id: string
  title: string
  body: string
  link_url: string | null
  is_active: boolean
  notify_email: boolean
  shops: { name: string; status: string } | null
}

interface FollowerRow {
  user_id: string
  user_notification_settings: { followed_shop_email: boolean } | null
}

/** HMAC-SHA256 で user_id を署名し、配信停止トークンを生成する */
async function buildUnsubscribeToken(userId: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(userId))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const idB64 = btoa(userId).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${idB64}.${sigB64}`
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

function buildEmailHtml(params: {
  shopName: string
  title: string
  bodyExcerpt: string
  shopUrl: string
  unsubscribeUrl: string
}): string {
  const { shopName, title, bodyExcerpt, shopUrl, unsubscribeUrl } = params

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
          <p style="margin:0 0 4px;font-size:9px;font-weight:900;letter-spacing:0.45em;text-transform:uppercase;color:#9ca3af;">— Followed Shop</p>
          <h1 style="margin:0 0 32px;font-size:22px;font-weight:900;letter-spacing:-0.03em;color:#1c1d2b;line-height:1.2;">フォロー中の店舗から<br>お知らせが届きました</h1>
          <div style="width:32px;height:2px;background:#1c1d2b;margin-bottom:32px;"></div>

          <!-- Announcement box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-left:3px solid #1c1d2b;margin-bottom:32px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 4px;font-size:9px;font-weight:900;letter-spacing:0.4em;text-transform:uppercase;color:#9ca3af;">${escapeHtml(shopName)}</p>
              <p style="margin:0 0 8px;font-size:18px;font-weight:900;letter-spacing:-0.02em;color:#1c1d2b;">${escapeHtml(title)}</p>
              ${bodyExcerpt ? `<p style="margin:0;font-size:13px;line-height:1.8;color:#4b5563;">${escapeHtml(bodyExcerpt)}</p>` : ''}
            </td></tr>
          </table>

          <!-- CTA -->
          <a href="${shopUrl}" style="display:inline-block;background:#1c1d2b;color:#fff;font-size:11px;font-weight:900;letter-spacing:0.3em;text-transform:uppercase;text-decoration:none;padding:14px 28px;">
            お店のページを見る →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f4f4f0;padding:24px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 6px;font-size:10px;color:#9ca3af;line-height:1.7;">このメールはFINDEでフォロー中の店舗のメール通知が有効になっているため送信されています。</p>
          <p style="margin:0;font-size:10px;line-height:1.7;"><a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">メール通知の配信を停止する</a></p>
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

  // 不特定多数へメールを送るため、DBトリガー等の内部呼び出しのみ許可する。
  if (!isServiceRoleRequest(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const resendApiKey      = Deno.env.get('RESEND_API_KEY')
    const fromEmail         = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'
    const siteUrl           = Deno.env.get('SITE_URL') ?? 'https://finde-cloud.com'
    const unsubscribeSecret = Deno.env.get('UNSUBSCRIBE_SECRET')
    const supabaseUrl       = Deno.env.get('SUPABASE_URL')!

    if (!resendApiKey) throw new Error('RESEND_API_KEY is not set')

    const { announcement_id } = await req.json() as { announcement_id: string }
    if (!announcement_id) throw new Error('announcement_id is required')

    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // お知らせ＋店舗を取得し、送信条件を再検証する
    const { data: announcement, error: annErr } = await supabase
      .from('shop_announcements')
      .select('id, shop_id, title, body, link_url, is_active, notify_email, shops ( name, status )')
      .eq('id', announcement_id)
      .single() as { data: AnnouncementRow | null; error: { message: string } | null }

    if (annErr || !announcement) throw new Error(annErr?.message ?? 'Announcement not found')

    const shop = announcement.shops
    if (!shop || shop.status !== 'public' || !announcement.is_active || !announcement.notify_email) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // メール受信ONのフォロワーを取得（設定行が無いユーザーは既定ON）
    const { data: followers, error: followErr } = await supabase
      .from('shop_follows')
      .select('user_id, user_notification_settings ( followed_shop_email )')
      .eq('shop_id', announcement.shop_id)
      .limit(1000) as { data: FollowerRow[] | null; error: { message: string } | null }

    if (followErr) throw new Error(followErr.message)

    const recipients = (followers ?? []).filter(
      (f) => f.user_notification_settings?.followed_shop_email ?? true,
    )

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const shopUrl = `${siteUrl}/shops/${announcement.shop_id}`
    const bodyExcerpt =
      announcement.body.length > 140 ? `${announcement.body.slice(0, 140)}…` : announcement.body

    let sentCount = 0
    for (const follower of recipients) {
      const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(follower.user_id)
      if (userErr || !user?.email) continue

      // 配信停止リンク（特定電子メール法対応・ワンクリック）。
      // UNSUBSCRIBE_SECRET 未設定時は通知設定画面へのリンクにフォールバックする。
      const unsubscribeUrl = unsubscribeSecret
        ? `${supabaseUrl}/functions/v1/unsubscribe-follow-email?token=${await buildUnsubscribeToken(follower.user_id, unsubscribeSecret)}`
        : `${siteUrl}/mypage/notifications`

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from:    fromEmail,
          to:      user.email,
          subject: `【FINDE】${shop.name} からのお知らせ`,
          html: buildEmailHtml({
            shopName: shop.name,
            title: announcement.title,
            bodyExcerpt,
            shopUrl,
            unsubscribeUrl,
          }),
        }),
      })

      if (res.ok) sentCount++
      else console.warn(`[send-follow-announcement-email] Resend error for ${user.email}:`, await res.text())
    }

    return new Response(JSON.stringify({ ok: true, sent: sentCount }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-follow-announcement-email]', err)
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
