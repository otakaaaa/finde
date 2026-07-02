-- =============================================================
-- SECURITY DEFINER 関数の search_path ハードニング
--
-- analytics 系および通知削除関数が `set search_path = public` のままだった。
-- 明示設定済みのため呼び出し元による search_path 操作は防げているが、
-- 他の全 SECURITY DEFINER 関数と同様 `''`（空）に統一する。
-- 対象関数の本体はすべて public.* で完全修飾済みのため、search_path を
-- 空にしても動作は変わらない（本体を書き換える必要はなく、設定のみ変更）。
-- =============================================================

alter function public.delete_expired_notifications()      set search_path = '';
alter function public.get_shop_view_analytics(uuid, int)  set search_path = '';
alter function public.get_shop_wish_analytics(uuid)        set search_path = '';
