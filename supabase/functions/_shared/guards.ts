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

// サービスロールクライアントを生成する。
export function createAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
}

// 先頭セグメントが本人IDであることを要求するバケット。
const SELF_OWNED_BUCKETS = new Set(['user-avatars', 'share-photos'])
// 先頭セグメントが shop_id（または listing-requests）であるバケット。
const SHOP_OWNED_BUCKETS = new Set(['shop-photos', 'shop-items', 'shop-announcements'])

// パスのトラバーサルや不正な形式を弾く。
function isSafeObjectPath(path: string): boolean {
  if (typeof path !== 'string' || path.length === 0) return false
  if (path.startsWith('/') || path.includes('..') || path.includes('\\')) return false
  return path.split('/').every((segment) => segment.length > 0)
}

async function callerOwnsShop(
  admin: SupabaseClient,
  userId: string,
  shopId: string,
): Promise<boolean> {
  const { data } = await admin
    .from('shop_staffs')
    .select('id')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

async function callerOwnsListingRequest(
  admin: SupabaseClient,
  userId: string,
  requestId: string,
): Promise<boolean> {
  const { data } = await admin
    .from('shop_listing_requests')
    .select('submitted_by')
    .eq('id', requestId)
    .maybeSingle()
  return !!data && (data as { submitted_by: string }).submitted_by === userId
}

// 呼び出し元が指定の bucket / path に対して書き込み・削除する権限を持つか検証する。
// バケットごとのパス命名規則と所有関係（本人・店舗スタッフ・管理者）で判定する。
export async function callerCanModifyObject(
  user: { id: string },
  bucket: string,
  path: string,
): Promise<boolean> {
  if (!isSafeObjectPath(path)) return false

  const segments = path.split('/')

  // 本人所有バケット: 先頭セグメントが本人IDである必要がある。
  if (SELF_OWNED_BUCKETS.has(bucket)) {
    return segments[0] === user.id
  }

  // 店舗所有バケット: 店舗スタッフ または 管理者、もしくは出店申請の申請者本人。
  if (SHOP_OWNED_BUCKETS.has(bucket)) {
    const admin = createAdminClient()

    if (await isAdmin(admin, user.id)) return true

    // shop-photos は出店申請時のアップロード経路 (listing-requests/{requestId}/...) を持つ。
    if (bucket === 'shop-photos' && segments[0] === 'listing-requests') {
      const requestId = segments[1]
      if (!requestId) return false
      return await callerOwnsListingRequest(admin, user.id, requestId)
    }

    const shopId = segments[0]
    return await callerOwnsShop(admin, user.id, shopId)
  }

  // 未知のバケットは拒否する。
  return false
}
