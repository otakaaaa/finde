-- シャレ活投稿の本文を任意化する（写真必須化に伴う変更）。
-- 旧: char_length(body) between 1 and 1000（1文字以上必須）
-- 新: char_length(body) <= 1000（空文字を許可。not null は維持し、未入力は '' として保存）
alter table public.share_posts
  drop constraint if exists share_posts_body_check;

alter table public.share_posts
  add constraint share_posts_body_check check (char_length(body) <= 1000);
