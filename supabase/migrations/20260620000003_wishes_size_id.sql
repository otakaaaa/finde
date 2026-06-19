-- =============================================================
-- wishes.size (text) → size_id (FK to sizes)
-- =============================================================

alter table public.wishes drop column if exists size;
alter table public.wishes add column size_id int references public.sizes(id);

create index wishes_size_id_idx on public.wishes (size_id);
