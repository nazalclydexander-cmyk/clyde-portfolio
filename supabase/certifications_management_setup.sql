-- Run in Supabase SQL Editor before using the certification admin page.
begin;
create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(), name text not null, issuer text not null,
  issue_date date not null, expiration_date date, credential_id text, verification_url text,
  badge_url text, status text not null default 'active' check (status in ('active','expired','pending')),
  sort_order integer not null default 1, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
alter table public.certifications enable row level security;
drop policy if exists "Public can view certifications" on public.certifications;
create policy "Public can view certifications" on public.certifications for select using (true);
drop policy if exists "Portfolio admins manage certifications" on public.certifications;
create policy "Portfolio admins manage certifications" on public.certifications for all to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certification-badges', 'certification-badges', true, 5242880, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do update set public = true, file_size_limit = 5242880;
drop policy if exists "Public can view certification badges" on storage.objects;
create policy "Public can view certification badges" on storage.objects for select using (bucket_id = 'certification-badges');
drop policy if exists "Portfolio admins upload certification badges" on storage.objects;
create policy "Portfolio admins upload certification badges" on storage.objects for insert to authenticated with check (bucket_id = 'certification-badges' and public.is_portfolio_admin());
drop policy if exists "Portfolio admins update certification badges" on storage.objects;
create policy "Portfolio admins update certification badges" on storage.objects for update to authenticated using (bucket_id = 'certification-badges' and public.is_portfolio_admin()) with check (bucket_id = 'certification-badges' and public.is_portfolio_admin());
drop policy if exists "Portfolio admins delete certification badges" on storage.objects;
create policy "Portfolio admins delete certification badges" on storage.objects for delete to authenticated using (bucket_id = 'certification-badges' and public.is_portfolio_admin());
commit;
