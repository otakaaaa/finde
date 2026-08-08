import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// フォロー店舗メール通知のワンクリック配信停止（特定電子メール法対応）。
// メール本文フッターの署名付きトークンURLから GET で呼ばれる。
// verify_jwt = false（supabase/config.toml）で公開し、トークンのHMAC検証で本人性を担保する。

const b64urlDecode = (value: string): string =>
  atob(value.replace(/-/g, '+').replace(/_/g, '/'))

async function verifyToken(token: string, secret: string): Promise<string | null> {
  const [idB64, sigB64] = token.split('.')
  if (!idB64 || !sigB64) return null

  let userId: string
  try {
    userId = b64urlDecode(idB64)
  } catch {
    return null
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(userId))
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  // 定数時間比較
  if (expected.length !== sigB64.length) return null
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sigB64.charCodeAt(i)
  return diff === 0 ? userId : null
}

const page = (title: string, message: string): string => `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}｜FINDE</title>
</head>
<body style="margin:0;background:#f4f4f0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:80px auto;padding:0 16px;">
    <p style="font-size:24px;font-weight:900;letter-spacing:-0.04em;color:#1c1d2b;margin:0 0 24px;">FINDE</p>
    <div style="background:#fff;padding:40px 32px;border-top:3px solid #1c1d2b;">
      <h1 style="font-size:18px;font-weight:900;color:#1c1d2b;margin:0 0 12px;">${title}</h1>
      <p style="font-size:13px;line-height:1.9;color:#4b5563;margin:0;">${message}</p>
    </div>
  </div>
</body>
</html>`

const htmlResponse = (status: number, title: string, message: string): Response =>
  new Response(page(title, message), {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })

serve(async (req) => {
  try {
    const secret = Deno.env.get('UNSUBSCRIBE_SECRET')
    if (!secret) {
      return htmlResponse(500, 'エラー', '現在この機能はご利用いただけません。時間をおいて再度お試しください。')
    }

    const token = new URL(req.url).searchParams.get('token') ?? ''
    const userId = await verifyToken(token, secret)
    if (!userId) {
      return htmlResponse(400, 'リンクが無効です', 'このリンクは無効か、期限切れの可能性があります。FINDEのマイページ「通知」から設定を変更してください。')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { error } = await supabase
      .from('user_notification_settings')
      .upsert({
        user_id: userId,
        followed_shop_email: false,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('[unsubscribe-follow-email]', error.message)
      return htmlResponse(500, 'エラー', '配信停止の処理に失敗しました。時間をおいて再度お試しください。')
    }

    return htmlResponse(
      200,
      '配信を停止しました',
      'フォロー中の店舗からのお知らせメールの配信を停止しました。再開したい場合は、FINDEのマイページ「通知」からいつでも設定を変更できます。',
    )
  } catch (err) {
    console.error('[unsubscribe-follow-email]', err)
    return htmlResponse(500, 'エラー', '予期しないエラーが発生しました。時間をおいて再度お試しください。')
  }
})
