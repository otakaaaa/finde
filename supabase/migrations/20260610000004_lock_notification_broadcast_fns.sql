-- =============================================================
-- 通知ブロードキャスト関数のRPC公開を遮断（大量スパム/フィッシング対策）
--
-- notify_all_users() / notify_admins() は SECURITY DEFINER で、
-- title / body / link_url / metadata を引数で受け取り通知行を作成する。
-- PUBLIC への EXECUTE 権限（既定）が残っていたため、Supabase の
-- PostgREST 経由で公開 anon キーだけで直接呼び出せた:
--
--   POST /rest/v1/rpc/notify_all_users
--     { "p_type":"news_published", "p_title":"...", "p_link_url":"https://evil/..." }
--
-- 影響:
--   - notify_all_users: 全登録ユーザーへ攻撃者が内容を制御した通知
--     （アプリ内通知 + 任意リンク）を一斉送信＝大量フィッシング/スパム
--   - notify_admins: 全管理者の通知フィードへ任意通知を注入
--
-- これらは本来トリガー関数（press_release 公開 / 新規申請・問い合わせ・通報）
-- からのみ内部呼び出しされる。呼び出し元はいずれも SECURITY DEFINER のため
-- 所有者権限で実行され、PUBLIC からの EXECUTE 剥奪の影響を受けない。
-- =============================================================

revoke all on function public.notify_all_users(text, text, text, text, jsonb) from public;
revoke all on function public.notify_admins(text, text, text, text, jsonb) from public;

-- Supabase が既定で付与している可能性のあるロール権限も明示的に剥奪する
revoke execute on function public.notify_all_users(text, text, text, text, jsonb) from anon, authenticated;
revoke execute on function public.notify_admins(text, text, text, text, jsonb) from anon, authenticated;
