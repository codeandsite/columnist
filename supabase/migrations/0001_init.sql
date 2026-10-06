-- ═══════════════════════════════════════════════════════════════════
-- COLUMNIST · 0001_init.sql
-- Core schema: profiles, categories, books, requests, access, progress.
-- Run in the Supabase SQL editor (or via migrations).
-- ═══════════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Helper: updated_at ──────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles ────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  membership  text not null default 'free' check (membership in ('free', 'pro')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Helper: is_admin (security definer, used by RLS) ────────────────
-- NOTE: must be created AFTER public.profiles exists — Postgres validates
-- an SQL-language function body at creation time.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ── categories ──────────────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── books ───────────────────────────────────────────────────────────
create table if not exists public.books (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text not null unique,
  author            text not null default 'Unknown',
  short_description text,
  description       text,
  price             numeric not null default 0,
  cover_path        text,
  epub_path         text,
  pdf_path          text,
  featured          boolean not null default false,
  published         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists books_slug_idx on public.books (slug);
create index if not exists books_published_idx on public.books (published, created_at desc);
create index if not exists books_featured_idx on public.books (featured) where featured = true;

-- ── book_categories (many-to-many) ──────────────────────────────────
create table if not exists public.book_categories (
  book_id     uuid not null references public.books(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (book_id, category_id)
);

-- ── purchase_requests ───────────────────────────────────────────────
create table if not exists public.purchase_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  book_id      uuid not null references public.books(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  approved_at  timestamptz,
  rejected_at  timestamptz,
  approved_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- no duplicate *pending* requests for the same user+book
  unique (user_id, book_id, status)
);
-- Partial unique: only one pending request per user+book. (approved/rejected can repeat
-- after re-request because the unique tuple includes status.)
drop index if exists purchase_requests_one_pending_idx;
create unique index purchase_requests_one_pending_idx
  on public.purchase_requests (user_id, book_id)
  where status = 'pending';
create index if not exists purchase_requests_status_idx on public.purchase_requests (status, requested_at desc);
create index if not exists purchase_requests_user_idx on public.purchase_requests (user_id);

-- ── book_access ─────────────────────────────────────────────────────
create table if not exists public.book_access (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  book_id    uuid not null references public.books(id) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  status     text not null default 'active',
  unique (user_id, book_id)
);

-- ── reading_progress ────────────────────────────────────────────────
create table if not exists public.reading_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  book_id     uuid not null references public.books(id) on delete cascade,
  location    text,
  progress    numeric not null default 0,
  last_opened timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, book_id)
);

-- ── contact_submissions ─────────────────────────────────────────────
create table if not exists public.contact_submissions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  created_at timestamptz not null default now()
);

-- ── updated_at triggers ─────────────────────────────────────────────
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.handle_updated_at();
drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.handle_updated_at();
drop trigger if exists trg_books_updated on public.books;
create trigger trg_books_updated before update on public.books
  for each row execute function public.handle_updated_at();
drop trigger if exists trg_requests_updated on public.purchase_requests;
create trigger trg_requests_updated before update on public.purchase_requests
  for each row execute function public.handle_updated_at();

-- ── Auto-create profile on signup ───────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, membership)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'user',
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.books enable row level security;
alter table public.book_categories enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.book_access enable row level security;
alter table public.reading_progress enable row level security;
alter table public.contact_submissions enable row level security;

-- ── profiles ──
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- Users may update their own profile, but NEVER role or membership.
create policy "profiles_update_own_limited"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and membership = (select p.membership from public.profiles p where p.id = auth.uid())
  );

create policy "profiles_admin_all"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── categories (public read, admin write) ──
create policy "categories_public_read"
  on public.categories for select using (true);
create policy "categories_admin_all"
  on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

-- ── books ──
create policy "books_public_read_published"
  on public.books for select using (published = true);
create policy "books_owner_read_with_access"
  on public.books for select to authenticated
  using (
    published = true
    or exists (
      select 1 from public.book_access ba
      where ba.book_id = books.id and ba.user_id = auth.uid()
    )
  );
create policy "books_admin_all"
  on public.books for all
  using (public.is_admin()) with check (public.is_admin());

-- ── book_categories ──
create policy "book_categories_public_read"
  on public.book_categories for select using (true);
create policy "book_categories_admin_all"
  on public.book_categories for all
  using (public.is_admin()) with check (public.is_admin());

-- ── purchase_requests ──
create policy "requests_select_own_or_admin"
  on public.purchase_requests for select
  using (auth.uid() = user_id or public.is_admin());
create policy "requests_insert_own"
  on public.purchase_requests for insert
  with check (auth.uid() = user_id);
create policy "requests_admin_all"
  on public.purchase_requests for all
  using (public.is_admin()) with check (public.is_admin());

-- ── book_access ──
create policy "access_select_own_or_admin"
  on public.book_access for select
  using (auth.uid() = user_id or public.is_admin());
create policy "access_admin_all"
  on public.book_access for all
  using (public.is_admin()) with check (public.is_admin());

-- ── reading_progress ──
create policy "progress_manage_own"
  on public.reading_progress for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- ── contact_submissions ──
create policy "contact_insert_anyone"
  on public.contact_submissions for insert with check (true);
create policy "contact_admin_read"
  on public.contact_submissions for select using (public.is_admin());
