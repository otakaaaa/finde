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

interface EmailTemplate {
  subject: string
  body: string
  is_active: boolean
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
    template,
  )
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

    // service role で申請情報・ユーザー情報を取得
    // SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY は Supabase が自動注入する変数
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

    const displayName = user.user_metadata?.display_name as string | undefined
    const submittedAt = new Date(request.created_at).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })

    // ── テンプレートを取得 ──────────────────────────────────
    const { data: tmpl } = await supabase
      .from('email_templates')
      .select('subject, body, is_active')
      .eq('slug', 'listing_request_received')
      .single() as { data: EmailTemplate | null; error: unknown }

    // ── 申請者への受付確認メール ────────────────────────────
    if (tmpl?.is_active) {
      const vars = {
        display_name: displayName ?? user.email,
        shop_name:    request.shop_name,
        submitted_at: submittedAt,
      }
      await sendEmail({
        resendApiKey,
        from:    fromEmail,
        to:      user.email,
        subject: renderTemplate(tmpl.subject, vars),
        text:    renderTemplate(tmpl.body, vars),
      })
    }

    // ── 管理者への新規申請通知メール ────────────────────────
    await sendEmail({
      resendApiKey,
      from:    fromEmail,
      to:      adminEmail,
      subject: `【フクナビ】新しい掲載申請: ${request.shop_name}`,
      text: [
        '新しい掲載申請が届きました。',
        '',
        `■ 申請情報`,
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
    // メール送信エラーはフロントには 200 で返す（申請自体は成功しているため）
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
