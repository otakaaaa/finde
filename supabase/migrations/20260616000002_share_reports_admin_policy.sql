-- Admin can delete share_post_reports (to dismiss reports)
create policy "share_post_reports: admin delete" on public.share_post_reports
  for delete using ((select public.is_admin()));
