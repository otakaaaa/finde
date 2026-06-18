import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.11'
import { getCallerUser } from '../_shared/guards.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const user = await getCallerUser(req)
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { bucket, path } = await req.json() as { bucket: string; path: string }

  if (!bucket || !path) {
    return new Response(JSON.stringify({ error: 'bucket と path は必須です' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const accountId = Deno.env.get('R2_ACCOUNT_ID')!
  const r2Bucket = Deno.env.get('R2_BUCKET')!

  const r2 = new AwsClient({
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
    service: 's3',
    region: 'auto',
  })

  const objectKey = `${bucket}/${path}`
  const url = new URL(`https://${accountId}.r2.cloudflarestorage.com/${r2Bucket}/${objectKey}`)
  url.searchParams.set('X-Amz-Expires', '300')

  const signed = await r2.sign(
    new Request(url, { method: 'PUT', headers: { 'x-amz-content-sha256': 'UNSIGNED-PAYLOAD' } }),
    { aws: { signQuery: true } },
  )

  return new Response(
    JSON.stringify({ uploadUrl: signed.url }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
