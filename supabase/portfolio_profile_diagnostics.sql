select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('portfolio_profile', 'portfolio_profiles', 'profiles');

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'portfolio_profile'
order by ordinal_position;

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'portfolio_profile';

select
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'portfolio_profile';

select
  id,
  singleton,
  display_name,
  headline,
  short_bio,
  profile_image_url,
  availability_text,
  github_url,
  location,
  focus,
  environment,
  builds,
  approach,
  updated_at
from public.portfolio_profile
limit 5;

select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'profile-images';

select
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects';
