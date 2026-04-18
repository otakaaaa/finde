import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const fromEmail    = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'
    const siteUrl      = Deno.env.get('SITE_URL') ?? 'https://fukunavi.example.com'

    if (!resendApiKey) throw new Error('RESEND_API_KEY is not set')

    const { user_id } = await req.json() as { user_id: string }
    if (!user_id) throw new Error('user_id is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(user_id)
    if (userErr || !user?.email) throw new Error(userErr?.message ?? 'User not found')

    const displayName = (user.user_metadata?.full_name as string | undefined) ?? 'お客'
    const createdAt = new Date(user.created_at).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })

    await sendEmail({
      resendApiKey,
      from:    fromEmail,
      to:      user.email,
      subject: '【フクナビ】会員登録が完了しました',
      text: [
        `${displayName} 様`,
        '',
        'この度はフクナビにご登録いただきありがとうございます。',
        '',
        '■ アカウント情報',
        `・メールアドレス: ${user.email}`,
        `・登録日時: ${createdAt}`,
        '',
        'フクナビでは、あなたのお気に入りのセレクトショップを見つけることができます。',
        'ぜひウィッシュリストや店舗検索をご活用ください。',
        '',
        'ご不明な点がございましたら、お気軽にお問い合わせください。',
        '',
        'フクナビ運営チーム',
        siteUrl,
      ].join('\n'),
    })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-welcome-email]', err)
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
