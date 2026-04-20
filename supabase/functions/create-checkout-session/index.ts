import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const priceIdMonthly = Deno.env.get('STRIPE_PRICE_ID_MONTHLY')
    const priceIdYearly = Deno.env.get('STRIPE_PRICE_ID_YEARLY')
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'

    if (!stripeKey || !priceIdMonthly || !priceIdYearly) {
      throw new Error('Stripe configuration is incomplete')
    }

    // JWT検証でユーザーを取得
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { plan } = await req.json() as { plan: 'monthly' | 'yearly' }
    if (plan !== 'monthly' && plan !== 'yearly') {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(stripeKey)

    // Service roleで既存のサブスクからcustomer_idを取得
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // ユーザープレミアム会員は shop_id = null で区別
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id, status')
      .eq('user_id', user.id)
      .is('shop_id', null)
      .in('status', ['active', 'trialing', 'past_due'])
      .maybeSingle()

    // すでにアクティブなサブスクがある場合はエラー
    if (existingSub) {
      return new Response(JSON.stringify({ error: 'Already subscribed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 既存のcustomer_idを取得（解約後の再登録に備える）
    const { data: anySub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .is('shop_id', null)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const existingCustomerId = anySub?.stripe_customer_id ?? null

    const priceId = plan === 'monthly' ? priceIdMonthly : priceIdYearly

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/mypage/subscription?success=true`,
      cancel_url: `${siteUrl}/mypage/subscription?canceled=true`,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
    }

    if (existingCustomerId) {
      sessionParams.customer = existingCustomerId
    } else {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('display_name')
        .eq('id', user.id)
        .single()

      sessionParams.customer_email = user.email
      sessionParams.customer_creation = 'always'
      if (userData?.display_name) {
        sessionParams.customer_creation = undefined
        // Customer を先に作成してから渡す
        const customer = await stripe.customers.create({
          email: user.email,
          name: userData.display_name,
          metadata: { user_id: user.id },
        })
        delete sessionParams.customer_email
        sessionParams.customer = customer.id
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
