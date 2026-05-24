import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ListingRequestRow {
  shop_name: string
  submitted_by: string
  created_at: string
}

async function sendEmail(params: {
  resendApiKey: string
  from: string
  to: string
  subject: string
  text: string
}): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend error ${res.status}: ${body}`)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const adminEmail   = Deno.env.get('ADMIN_EMAIL')
    const fromEmail    = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'

    if (!resendApiKey) throw new Error('RESEND_API_KEY is not set')
    if (!adminEmail)   throw new Error('ADMIN_EMAIL is not set')

    const { request_id } = await req.json() as { request_id: string }
    if (!request_id) throw new Error('request_id is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: request, error: requestErr } = await supabase
      .from('shop_listing_requests')
      .select('shop_name, submitted_by, created_at')
      .eq('id', request_id)
      .single() as { data: ListingRequestRow | null; error: { message: string } | null }

    if (requestErr || !request) throw new Error(requestErr?.message ?? 'Request not found')

    const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(
      request.submitted_by,
    )
    if (userErr || !user?.email) throw new Error(userErr?.message ?? 'User not found')

    const displayName = user.user_metadata?.full_name as string | undefined
    const submittedAt = new Date(request.created_at).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })

    // ── 申請者への受付確認メール ────────────────────────────
    await sendEmail({
      resendApiKey,
      from:    fromEmail,
      to:      user.email,
      subject: '【FINDE】掲載申請を受け付けました',
      text: [
        `${displayName ?? 'お客'}様`,
        '',
        'この度はFINDEへ店舗掲載申請をいただきありがとうございます。',
        '以下の内容で申請を受け付けました。',
        '',
        '■ 申請内容',
        `・店舗名   : ${request.shop_name}`,
        `・申請日時 : ${submittedAt}`,
        '',
        'FINDE運営チームが内容を確認の上、審査完了後にメールにてご連絡いたします。',
        '通常2〜5営業日程度お時間をいただきます。',
        '',
        'ご不明な点がございましたら、お問い合わせよりご連絡ください。',
        '',
        'FINDE運営チーム',
      ].join('\n'),
    })

    // ── 管理者への新規申請通知メール ────────────────────────
    await sendEmail({
      resendApiKey,
      from:    fromEmail,
      to:      adminEmail,
      subject: `【FINDE】新しい掲載申請: ${request.shop_name}`,
      text: [
        '新しい掲載申請が届きました。',
        '',
        '■ 申請情報',
        `・店舗名   : ${request.shop_name}`,
        `・申請者   : ${displayName ?? '未設定'} (${user.email})`,
        `・申請日時 : ${submittedAt}`,
        '',
        '管理画面から内容を確認してください。',
      ].join('\n'),
    })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-listing-request-notification]', err)
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
