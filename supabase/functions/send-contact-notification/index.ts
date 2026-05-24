import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContactRow {
  name: string
  email: string
  category: string
  subject: string
  is_noreply: boolean
  created_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  general:      '一般的なご質問',
  shop_listing: '店舗掲載について',
  bug_report:   'バグ・不具合',
  account:      'アカウントについて',
  other:        'その他',
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
    const siteUrl      = Deno.env.get('SITE_URL') ?? 'https://finde.example.com'

    if (!resendApiKey) throw new Error('RESEND_API_KEY is not set')

    const { contact_id } = await req.json() as { contact_id: string }
    if (!contact_id) throw new Error('contact_id is required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: contact, error: contactErr } = await supabase
      .from('contacts')
      .select('name, email, category, subject, is_noreply, created_at')
      .eq('id', contact_id)
      .single() as { data: ContactRow | null; error: { message: string } | null }

    if (contactErr || !contact) throw new Error(contactErr?.message ?? 'Contact not found')

    const categoryLabel = CATEGORY_LABELS[contact.category] ?? contact.category
    const receivedAt = new Date(contact.created_at).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })

    const replyNote = contact.is_noreply
      ? null
      : '返信までに数日お時間をいただく場合がございます。'

    await sendEmail({
      resendApiKey,
      from:    fromEmail,
      to:      contact.email,
      subject: '【FINDE】お問い合わせを受け付けました',
      text: [
        `${contact.name} 様`,
        '',
        'この度はFINDEへお問い合わせいただきありがとうございます。',
        '以下の内容でお問い合わせを受け付けました。',
        '',
        '■ お問い合わせ内容',
        `・件名: ${contact.subject}`,
        `・カテゴリ: ${categoryLabel}`,
        `・受付日時: ${receivedAt}`,
        '',
        '内容を確認の上、担当者よりご連絡いたします。',
        ...(replyNote ? [replyNote] : []),
        '',
        'FINDE運営チーム',
        siteUrl,
      ].join('\n'),
    })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-contact-notification]', err)
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
