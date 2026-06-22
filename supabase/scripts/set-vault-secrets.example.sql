-- =============================================================
-- Vault シークレット投入スクリプト（テンプレート）
--
-- ⚠️ このファイルはテンプレートです。実値は書かないでください。
--    実運用では値を差し替えたコピーを作り、各環境で1回だけ実行します。
--    （コピー先は .gitignore 済みの set-vault-secrets.local.sql を推奨）
--
-- 登録するシークレット:
--   - project_url       : Edge Function を呼ぶベースURL
--   - service_role_key  : サービスロールキー（DB全権限・厳重管理）
--
-- 実行例:
--   ローカル: psql "$(npx supabase status -o env | grep DB_URL | cut -d= -f2 | tr -d '\"')" \
--               -f supabase/scripts/set-vault-secrets.local.sql
--   本番   : Supabase ダッシュボードの SQL Editor に貼り付けて実行
--            （または psql で本番 DB URL に対して実行）
--
-- 値の目安:
--   project_url      ローカル: http://host.docker.internal:54321
--                    本番    : https://<project-ref>.supabase.co
--   service_role_key 各環境の service_role キー
-- =============================================================

-- project_url（冪等: 無ければ作成・あれば更新）
do $$
declare
  v_id uuid;
  v_value text := 'http://host.docker.internal:54321';  -- ← 環境に合わせて差し替え
begin
  select id into v_id from vault.secrets where name = 'project_url';
  if v_id is null then
    perform vault.create_secret(v_value, 'project_url', 'Edge Function ベースURL');
  else
    perform vault.update_secret(v_id, v_value, 'project_url', 'Edge Function ベースURL');
  end if;
end $$;

-- service_role_key（冪等）
do $$
declare
  v_id uuid;
  v_value text := 'REPLACE_WITH_SERVICE_ROLE_KEY';  -- ← 各環境の service_role キーに差し替え
begin
  select id into v_id from vault.secrets where name = 'service_role_key';
  if v_id is null then
    perform vault.create_secret(v_value, 'service_role_key', 'service_role キー');
  else
    perform vault.update_secret(v_id, v_value, 'service_role_key', 'service_role キー');
  end if;
end $$;

-- 確認（復号して表示。実行ログに平文が出る点に注意）
-- select name, decrypted_secret from vault.decrypted_secrets where name in ('project_url','service_role_key');
