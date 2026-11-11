begin;

create table if not exists public.admin_users (
  user_id uuid primary key,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.admin_users enable row level security;

revoke all on public.admin_users from anon, authenticated;

create or replace function public.is_portfolio_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

drop policy if exists "Authenticated users can insert portfolio profile" on public.portfolio_profile;
drop policy if exists "Authenticated users can update portfolio profile" on public.portfolio_profile;
drop policy if exists "Portfolio admins can insert portfolio profile" on public.portfolio_profile;
drop policy if exists "Portfolio admins can update portfolio profile" on public.portfolio_profile;
drop policy if exists "Portfolio admins can delete portfolio profile" on public.portfolio_profile;

create policy "Portfolio admins can insert portfolio profile"
on public.portfolio_profile
for insert
to authenticated
with check (
  singleton = true
  and public.is_portfolio_admin()
);

create policy "Portfolio admins can update portfolio profile"
on public.portfolio_profile
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

create policy "Portfolio admins can delete portfolio profile"
on public.portfolio_profile
for delete
to authenticated
using (
  singleton = true
  and public.is_portfolio_admin()
);

drop policy if exists "Authenticated users can upload profile images" on storage.objects;
drop policy if exists "Authenticated users can update profile images" on storage.objects;
drop policy if exists "Authenticated users can delete profile images" on storage.objects;
drop policy if exists "Portfolio admins can upload profile images" on storage.objects;
drop policy if exists "Portfolio admins can update profile images" on storage.objects;
drop policy if exists "Portfolio admins can delete profile images" on storage.objects;

create policy "Portfolio admins can upload profile images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and public.is_portfolio_admin()
);

create policy "Portfolio admins can update profile images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-images'
  and public.is_portfolio_admin()
)
with check (
  bucket_id = 'profile-images'
  and public.is_portfolio_admin()
);

create policy "Portfolio admins can delete profile images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and public.is_portfolio_admin()
);

commit;
