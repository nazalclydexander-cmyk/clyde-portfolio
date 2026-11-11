begin;

-- Replace any existing projects/skills/messages policies with a final
-- is_portfolio_admin()-based model.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('projects', 'skills', 'messages')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end
$$;

alter table public.projects enable row level security;
alter table public.skills enable row level security;
alter table public.messages enable row level security;

create policy "Public can read published projects"
on public.projects
for select
to public
using (status = 'published');

create policy "Portfolio admins can read all projects"
on public.projects
for select
to authenticated
using (public.is_portfolio_admin());

create policy "Portfolio admins can insert projects"
on public.projects
for insert
to authenticated
with check (public.is_portfolio_admin());

create policy "Portfolio admins can update projects"
on public.projects
for update
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

create policy "Portfolio admins can delete projects"
on public.projects
for delete
to authenticated
using (public.is_portfolio_admin());

create policy "Public can read skills"
on public.skills
for select
to public
using (true);

create policy "Portfolio admins can insert skills"
on public.skills
for insert
to authenticated
with check (public.is_portfolio_admin());

create policy "Portfolio admins can update skills"
on public.skills
for update
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

create policy "Portfolio admins can delete skills"
on public.skills
for delete
to authenticated
using (public.is_portfolio_admin());

create policy "Portfolio admins can read messages"
on public.messages
for select
to authenticated
using (public.is_portfolio_admin());

create policy "Portfolio admins can update messages"
on public.messages
for update
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

create policy "Portfolio admins can delete messages"
on public.messages
for delete
to authenticated
using (public.is_portfolio_admin());

-- Remove any remaining hard-coded UUID storage policies for project-images
-- and profile-images, then recreate the full project-images policy set.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        (
          (coalesce(qual, '') ilike '%project-images%' or coalesce(with_check, '') ilike '%project-images%')
        )
        or (
          (coalesce(qual, '') ilike '%profile-images%' or coalesce(with_check, '') ilike '%profile-images%')
          and (
            coalesce(qual, '') ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
            or coalesce(with_check, '') ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
          )
        )
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end
$$;

drop policy if exists "Public can view project images" on storage.objects;
drop policy if exists "Portfolio admins can upload project images" on storage.objects;
drop policy if exists "Portfolio admins can update project images" on storage.objects;
drop policy if exists "Portfolio admins can delete project images" on storage.objects;

create policy "Public can view project images"
on storage.objects
for select
to public
using (bucket_id = 'project-images');

create policy "Portfolio admins can upload project images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-images'
  and public.is_portfolio_admin()
);

create policy "Portfolio admins can update project images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'project-images'
  and public.is_portfolio_admin()
)
with check (
  bucket_id = 'project-images'
  and public.is_portfolio_admin()
);

create policy "Portfolio admins can delete project images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-images'
  and public.is_portfolio_admin()
);

create or replace function public.normalize_project_sort_orders()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_portfolio_admin() then
    raise exception 'Not authorized'
      using errcode = '42501';
  end if;

  set constraints projects_sort_order_unique deferred;

  with ranked as (
    select
      id,
      row_number() over (
        order by sort_order asc, created_at asc nulls last, id asc
      ) as new_sort_order
    from public.projects
  )
  update public.projects as projects
  set
    sort_order = ranked.new_sort_order,
    updated_at = timezone('utc', now())
  from ranked
  where projects.id = ranked.id
    and projects.sort_order is distinct from ranked.new_sort_order;
end;
$$;

create or replace function public.ensure_single_featured_project()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_featured_id uuid;
begin
  if not public.is_portfolio_admin() then
    raise exception 'Not authorized'
      using errcode = '42501';
  end if;

  select id
  into v_featured_id
  from public.projects
  order by sort_order asc, created_at asc nulls last, id asc
  limit 1;

  if v_featured_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.projects
    where featured = true
  ) then
    update public.projects
    set
      featured = (id = v_featured_id),
      updated_at = timezone('utc', now())
    where id = v_featured_id;
  end if;
end;
$$;

create or replace function public.save_portfolio_project(
  p_project_id uuid default null,
  p_title text default null,
  p_slug text default null,
  p_description text default null,
  p_long_description text default null,
  p_image_url text default null,
  p_github_url text default null,
  p_demo_url text default null,
  p_technologies text[] default null,
  p_status text default 'draft',
  p_featured boolean default false,
  p_target_position integer default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_project_id uuid;
  v_old_position integer;
  v_project_count integer;
  v_target_position integer;
begin
  if not public.is_portfolio_admin() then
    raise exception 'Not authorized'
      using errcode = '42501';
  end if;

  if nullif(trim(coalesce(p_title, '')), '') is null then
    raise exception 'Project title is required';
  end if;

  if nullif(trim(coalesce(p_slug, '')), '') is null then
    raise exception 'Project slug is required';
  end if;

  if p_status not in ('draft', 'published', 'archived') then
    raise exception 'Invalid project status';
  end if;

  set constraints projects_sort_order_unique deferred;

  select count(*)
  into v_project_count
  from public.projects;

  if p_project_id is not null then
    select sort_order
    into v_old_position
    from public.projects
    where id = p_project_id
    for update;

    if not found then
      raise exception 'Project not found';
    end if;

    v_target_position := greatest(
      1,
      least(coalesce(p_target_position, v_old_position, 1), greatest(v_project_count, 1))
    );

    update public.projects
    set
      title = trim(p_title),
      slug = trim(p_slug),
      description = nullif(trim(coalesce(p_description, '')), ''),
      long_description = nullif(trim(coalesce(p_long_description, '')), ''),
      image_url = nullif(trim(coalesce(p_image_url, '')), ''),
      github_url = nullif(trim(coalesce(p_github_url, '')), ''),
      demo_url = nullif(trim(coalesce(p_demo_url, '')), ''),
      technologies = coalesce(p_technologies, '{}'),
      status = p_status,
      featured = false,
      updated_at = timezone('utc', now())
    where id = p_project_id;

    if v_target_position < v_old_position then
      update public.projects
      set
        sort_order = sort_order + 1,
        updated_at = timezone('utc', now())
      where id <> p_project_id
        and sort_order >= v_target_position
        and sort_order < v_old_position;
    elseif v_target_position > v_old_position then
      update public.projects
      set
        sort_order = sort_order - 1,
        updated_at = timezone('utc', now())
      where id <> p_project_id
        and sort_order <= v_target_position
        and sort_order > v_old_position;
    end if;

    update public.projects
    set
      sort_order = v_target_position,
      updated_at = timezone('utc', now())
    where id = p_project_id;

    v_project_id := p_project_id;
  else
    v_target_position := greatest(
      1,
      least(coalesce(p_target_position, v_project_count + 1), v_project_count + 1)
    );

    update public.projects
    set
      sort_order = sort_order + 1,
      updated_at = timezone('utc', now())
    where sort_order >= v_target_position;

    insert into public.projects (
      title,
      slug,
      description,
      long_description,
      image_url,
      github_url,
      demo_url,
      technologies,
      status,
      featured,
      sort_order,
      updated_at
    )
    values (
      trim(p_title),
      trim(p_slug),
      nullif(trim(coalesce(p_description, '')), ''),
      nullif(trim(coalesce(p_long_description, '')), ''),
      nullif(trim(coalesce(p_image_url, '')), ''),
      nullif(trim(coalesce(p_github_url, '')), ''),
      nullif(trim(coalesce(p_demo_url, '')), ''),
      coalesce(p_technologies, '{}'),
      p_status,
      false,
      v_target_position,
      timezone('utc', now())
    )
    returning id into v_project_id;
  end if;

  if p_featured then
    update public.projects
    set
      featured = false,
      updated_at = timezone('utc', now())
    where id <> v_project_id
      and featured = true;

    update public.projects
    set
      featured = true,
      updated_at = timezone('utc', now())
    where id = v_project_id;
  end if;

  perform public.normalize_project_sort_orders();
  perform public.ensure_single_featured_project();

  return v_project_id;
end;
$$;

create or replace function public.delete_portfolio_project(
  p_project_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_portfolio_admin() then
    raise exception 'Not authorized'
      using errcode = '42501';
  end if;

  if p_project_id is null then
    raise exception 'Project id is required';
  end if;

  set constraints projects_sort_order_unique deferred;

  delete from public.projects
  where id = p_project_id;

  if not found then
    raise exception 'Project not found';
  end if;

  perform public.normalize_project_sort_orders();
  perform public.ensure_single_featured_project();
end;
$$;

revoke execute on function public.normalize_project_sort_orders() from public, anon, authenticated;
revoke execute on function public.ensure_single_featured_project() from public, anon, authenticated;
revoke execute on function public.save_portfolio_project(uuid, text, text, text, text, text, text, text, text[], text, boolean, integer) from public, anon, authenticated;
revoke execute on function public.delete_portfolio_project(uuid) from public, anon, authenticated;

grant execute on function public.normalize_project_sort_orders() to authenticated;
grant execute on function public.ensure_single_featured_project() to authenticated;
grant execute on function public.save_portfolio_project(uuid, text, text, text, text, text, text, text, text[], text, boolean, integer) to authenticated;
grant execute on function public.delete_portfolio_project(uuid) to authenticated;

commit;
