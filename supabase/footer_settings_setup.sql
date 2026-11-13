-- Run this once in the Supabase SQL Editor after portfolio_profile_setup.sql.
begin;

create table if not exists public.footer_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton = true),
  enabled boolean not null default true,
  title text not null default 'Practical cloud, support, and web systems for real operations.',
  subtitle text,
  show_about_link boolean not null default true,
  show_capabilities_link boolean not null default true,
  show_work_link boolean not null default true,
  show_contact_link boolean not null default true,
  show_certifications_link boolean not null default true,
  show_github_link boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.footer_settings
add column if not exists show_certifications_link boolean not null default true;

create or replace function public.set_footer_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists footer_settings_set_updated_at on public.footer_settings;
create trigger footer_settings_set_updated_at
before update on public.footer_settings
for each row
execute function public.set_footer_settings_updated_at();

alter table public.footer_settings enable row level security;

drop policy if exists "Public can read footer settings" on public.footer_settings;
create policy "Public can read footer settings"
on public.footer_settings
for select
to public
using (true);

drop policy if exists "Portfolio admins can insert footer settings" on public.footer_settings;
create policy "Portfolio admins can insert footer settings"
on public.footer_settings
for insert
to authenticated
with check (
  singleton = true
  and public.is_portfolio_admin()
);

drop policy if exists "Portfolio admins can update footer settings" on public.footer_settings;
create policy "Portfolio admins can update footer settings"
on public.footer_settings
for update
to authenticated
using (
  singleton = true
  and public.is_portfolio_admin()
)
with check (
  singleton = true
  and public.is_portfolio_admin()
);

drop policy if exists "Portfolio admins can delete footer settings" on public.footer_settings;
create policy "Portfolio admins can delete footer settings"
on public.footer_settings
for delete
to authenticated
using (
  singleton = true
  and public.is_portfolio_admin()
);

insert into public.footer_settings (singleton)
values (true)
on conflict (singleton) do nothing;

commit;
