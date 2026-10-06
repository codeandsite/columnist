-- ═══════════════════════════════════════════════════════════════════
-- COLUMNIST · 0003_settings.sql
-- Global site settings (key/value store). Public read, admin write.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.site_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_site_settings_updated on public.site_settings;
create trigger trg_site_settings_updated before update on public.site_settings
  for each row execute function public.handle_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read"
  on public.site_settings for select using (true);

drop policy if exists "settings_admin_all" on public.site_settings;
create policy "settings_admin_all"
  on public.site_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- ── Defaults ────────────────────────────────────────────────────────
insert into public.site_settings (key, value) values
  ('site_name', 'Columnist'),
  ('tagline', 'Ebooks for a wiser you'),
  ('contact_email', 'hello@columnist.site')
on conflict (key) do nothing;
