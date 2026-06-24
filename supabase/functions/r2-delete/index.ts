import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.11'
import { getCallerUser, callerCanModifyObject } from '../_shared/guards.ts'

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

  const { bucket, paths } = await req.json() as { bucket: string; paths: string[] }

  if (!bucket || !Array.isArray(paths) || paths.length === 0) {
    return new Response(JSON.stringify({ error: 'bucket と paths は必須です' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 全パスについて呼び出し元が所有者か検証する。1つでも権限がなければ全体を拒否する。
  const ownershipChecks = await Promise.all(
    paths.map((path) => callerCanModifyObject(user, bucket, path)),
  )
  if (ownershipChecks.some((allowed) => !allowed)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
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

  for (const path of paths) {
    const objectKey = `${bucket}/${path}`
    const url = new URL(`https://${accountId}.r2.cloudflarestorage.com/${r2Bucket}/${objectKey}`)
    const signed = await r2.sign(new Request(url, { method: 'DELETE' }))
    await fetch(signed)
  }

  return new Response(
    JSON.stringify({ ok: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
