import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 公開 anon キーでも verify_jwt は通過するため、Edge Function 側で
// 「誰が呼んだのか」を必ず検証する。以下はそのための共通ガード。

// タイミング攻撃でサービスロールキーが推測されないよう定数時間で比較する。
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// DB トリガー等の内部呼び出しはサービスロールキーを Bearer に載せて呼ぶ。
// サービスロールキーはクライアントに露出しないため、これを「信頼できる
// 内部呼び出し」の証明として用いる（公開 anon キー保持者を排除する）。
export function isServiceRoleRequest(req: Request): boolean {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!serviceRoleKey) return false
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  return token.length > 0 && timingSafeEqual(token, serviceRoleKey)
}

// リクエストの JWT に紐づくエンドユーザーを解決する。
// anon キーのみの匿名呼び出しでは null を返す。
export async function getCallerUser(
  req: Request,
): Promise<{ id: string; email?: string } | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const client = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data, error } = await client.auth.getUser()
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email ?? undefined }
}

// サービスロールクライアントで users.role = 'admin' を確認する。
export async function isAdmin(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  if (error || !data) return false
  return (data as { role: string }).role === 'admin'
}
