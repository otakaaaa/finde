-- =============================================================
-- users: シャレ活の投稿者・コメント投稿者の公開読み取りポリシー
-- =============================================================
-- レビュー機能削除（20260626000001）で "users: public read for review authors"
-- を drop した際、公開シャレ活に紐づくユーザーの参照経路が失われ、
-- 投稿者情報（display_name / avatar_url）が本人・admin 以外に null で返り
-- 全員「匿名ユーザー」表示になっていた。
-- 公開コンテンツ（公開済みシャレ活投稿・そのコメント）に紐づくユーザーの
-- 行のみ、誰でも参照可能にする。
-- ※ users テーブルは id / role / display_name / avatar_url / タイムスタンプのみで
--   メール等の秘匿情報は含まない（旧レビューポリシーと同等の公開範囲）。

create policy "users: public read for share authors" on public.users
  for select using (
    exists (
      select 1 from public.share_posts p
      where p.user_id = public.users.id
        and p.state = 'published'
        and p.status = 'published'
        and p.visibility = 'public'
    )
    or exists (
      select 1
      from public.share_comments c
      join public.share_posts p on p.id = c.post_id
      where c.user_id = public.users.id
        and c.status = 'published'
        and p.state = 'published'
        and p.status = 'published'
        and p.visibility = 'public'
    )
  );

-- ポリシーの exists 検索用（share_posts は share_posts_user_idx が既存）
create index if not exists share_comments_user_idx
  on public.share_comments (user_id);
