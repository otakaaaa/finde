import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ListingRequestRow {
  shop_name: string
  submitted_by: string
  is_owner_request: boolean
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

    const { request_id, status } = await req.json() as {
      request_id: string
      status: 'approved' | 'rejected'
    }
    if (!request_id) throw new Error('request_id is required')
    if (status !== 'approved' && status !== 'rejected') throw new Error('status must be approved or rejected')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: request, error: requestErr } = await supabase
      .from('shop_listing_requests')
      .select('shop_name, submitted_by, is_owner_request')
      .eq('id', request_id)
      .single() as { data: ListingRequestRow | null; error: { message: string } | null }

    if (requestErr || !request) throw new Error(requestErr?.message ?? 'Request not found')

    const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(
      request.submitted_by,
    )
    if (userErr || !user?.email) throw new Error(userErr?.message ?? 'User not found')

    const displayName = (user.user_metadata?.full_name as string | undefined) ?? 'お客様'
    const approvedAt = new Date().toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })

    if (status === 'approved') {
      const dashboardSection = request.is_owner_request
        ? [
            'オーナーダッシュボードから店舗情報の編集や写真の追加が行えます。',
            `${siteUrl}/owner`,
          ].join('\n')
        : null

      await sendEmail({
        resendApiKey,
        from:    fromEmail,
        to:      user.email,
        subject: '【フクナビ】店舗掲載申請が承認されました',
        text: [
          `${displayName} 様`,
          '',
          'ご申請いただいた店舗の掲載が承認されました。',
          '',
          '■ 承認内容',
          `・店舗名: ${request.shop_name}`,
          `・承認日時: ${approvedAt}`,
          '',
          ...(dashboardSection ? [dashboardSection, ''] : []),
          '引き続きフクナビをよろしくお願いいたします。',
          '',
          'フクナビ運営チーム',
        ].join('\n'),
      })
    } else {
      await sendEmail({
        resendApiKey,
        from:    fromEmail,
        to:      user.email,
        subject: '【フクナビ】店舗掲載申請について',
        text: [
          `${displayName} 様`,
          '',
          `ご申請いただいた「${request.shop_name}」の掲載申請について、`,
          '今回は掲載の承認が難しい状況となりました。',
          '',
          '内容を修正の上、再度申請いただくことも可能です。',
          'ご不明な点はお問い合わせよりご連絡ください。',
          '',
          'フクナビ運営チーム',
        ].join('\n'),
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-listing-status-notification]', err)
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
