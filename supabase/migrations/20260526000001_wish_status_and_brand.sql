-- =============================================================
-- wishes テーブル拡張
--   1. status カラム: active（探し中）/ closed（見つかった）
--   2. brand_id カラム: ブランドタイプ時のブランド指定
-- =============================================================

alter table public.wishes
  add column status text not null default 'active'
    check (status in ('active', 'closed'));

alter table public.wishes
  add column brand_id uuid references public.brands(id) on delete set null;

-- status でのフィルタリング高速化
create index wishes_user_status_idx
  on public.wishes (user_id, status, created_at desc);
