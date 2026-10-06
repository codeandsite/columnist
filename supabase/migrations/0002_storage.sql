-- ═══════════════════════════════════════════════════════════════════
-- COLUMNIST · 0002_storage.sql
-- Private/public buckets + storage policies.
-- book-covers + avatars are PUBLIC (safe to hotlink).
-- book-epubs + book-pdfs are PRIVATE — served only via signed URLs
-- generated server-side after an access check. No public read policy.
-- ═══════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values
  ('book-covers', 'book-covers', true),
  ('book-epubs',  'book-epubs',  false),
  ('book-pdfs',   'book-pdfs',   false),
  ('avatars',     'avatars',     true)
on conflict (id) do nothing;

-- ── Public reads ──
create policy "covers_public_read"
  on storage.objects for select
  using (bucket_id = 'book-covers');

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ── Admins manage every bucket (uploads go through the service role,
--     but the policy keeps dashboard/SQL access consistent) ──
create policy "storage_admin_all"
  on storage.objects for all
  using (
    public.is_admin()
    and bucket_id in ('book-covers', 'book-epubs', 'book-pdfs', 'avatars')
  )
  with check (
    public.is_admin()
    and bucket_id in ('book-covers', 'book-epubs', 'book-pdfs', 'avatars')
  );

-- ── Users can manage their own avatar folder: avatars/<uid>/… ──
create policy "avatars_user_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_user_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_user_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- NOTE: book-epubs and book-pdfs have NO select policy for regular users.
-- Files are served exclusively through signed URLs minted by the
-- service-role client after verifying book_access on the server.
