-- Add indexes to support efficient pagination on the brands table.
-- ORDER BY created_at DESC (used in admin brand list) was doing a full sequential scan.
create index brands_created_at_idx on public.brands(created_at desc);

-- Compound index for status-filtered queries with ordering.
create index brands_status_created_at_idx on public.brands(status, created_at desc);
