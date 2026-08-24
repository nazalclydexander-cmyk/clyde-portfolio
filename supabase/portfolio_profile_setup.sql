create table if not exists public.portfolio_profile (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton = true),
  display_name text,
  headline text,
  short_bio text,
  availability_text text,
  github_url text,
  profile_image_url text,
  profile_image_path text,
  location text,
  focus text,
  environment text,
  builds text,
  approach text,
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_portfolio_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists portfolio_profile_set_updated_at on public.portfolio_profile;
create trigger portfolio_profile_set_updated_at
before update on public.portfolio_profile
for each row
execute function public.set_portfolio_profile_updated_at();

alter table public.portfolio_profile enable row level security;

drop policy if exists "Public can read portfolio profile" on public.portfolio_profile;
create policy "Public can read portfolio profile"
on public.portfolio_profile
for select
to public
using (true);

drop policy if exists "Authenticated users can insert portfolio profile" on public.portfolio_profile;
create policy "Authenticated users can insert portfolio profile"
on public.portfolio_profile
for insert
to authenticated
with check (singleton = true);

drop policy if exists "Authenticated users can update portfolio profile" on public.portfolio_profile;
create policy "Authenticated users can update portfolio profile"
on public.portfolio_profile
for update
to authenticated
using (singleton = true)
with check (singleton = true);

insert into public.portfolio_profile (
  singleton,
  display_name,
  headline,
  short_bio,
  availability_text,
  focus,
  environment,
  builds,
  approach
)
values (
  true,
  'Clyde',
  'Building practical systems across cloud, infrastructure, and the web.',
  'I''m Clyde - a technical support, cloud, and development professional focused on reliable solutions that solve real operational problems.',
  'Open to opportunities',
  'Technical support',
  'Cloud & infrastructure',
  'Modern web systems',
  'Practical & reliable'
)
on conflict (singleton) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  4194304,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view profile images" on storage.objects;
create policy "Public can view profile images"
on storage.objects
for select
to public
using (bucket_id = 'profile-images');

drop policy if exists "Authenticated users can upload profile images" on storage.objects;
create policy "Authenticated users can upload profile images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'profile-images');

drop policy if exists "Authenticated users can update profile images" on storage.objects;
create policy "Authenticated users can update profile images"
on storage.objects
for update
to authenticated
using (bucket_id = 'profile-images')
with check (bucket_id = 'profile-images');

drop policy if exists "Authenticated users can delete profile images" on storage.objects;
create policy "Authenticated users can delete profile images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'profile-images');
