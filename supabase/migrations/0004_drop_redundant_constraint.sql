-- 0004: drop the redundant table-level unique(user_id, book_id, status) on
-- purchase_requests. The partial unique index purchase_requests_one_pending_idx
-- (user_id, book_id where status = 'pending') is the intended constraint:
-- only one *pending* request per user+book; approved/rejected rows may repeat
-- after re-requests.
do $$
begin
  -- Find the auto-generated constraint name for unique(user_id, book_id, status)
  -- and drop it if present.
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.purchase_requests'::regclass
      and contype = 'u'
      and array_length(conkey, 1) = 3
  ) then
    execute (
      select 'alter table public.purchase_requests drop constraint ' || quote_ident(conname)
      from pg_constraint
      where conrelid = 'public.purchase_requests'::regclass
        and contype = 'u'
        and array_length(conkey, 1) = 3
      limit 1
    );
  end if;
end $$;

-- Ensure the partial pending index exists (idempotent).
create unique index if not exists purchase_requests_one_pending_idx
  on public.purchase_requests (user_id, book_id)
  where status = 'pending';
