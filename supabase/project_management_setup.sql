-- Portfolio project management helpers
-- Run this manually in the Supabase SQL editor for the connected project.

begin;

create or replace function public.normalize_project_sort_orders()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
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
set search_path = public
as $$
declare
  v_featured_id uuid;
begin
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
set search_path = public
as $$
declare
  v_project_id uuid;
  v_old_position integer;
  v_project_count integer;
  v_target_position integer;
begin
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
set search_path = public
as $$
begin
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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_sort_order_unique'
  ) then
    alter table public.projects
      add constraint projects_sort_order_unique
      unique (sort_order)
      deferrable initially immediate;
  end if;
end $$;

create unique index if not exists projects_one_featured_idx
on public.projects ((featured))
where featured = true;

select public.normalize_project_sort_orders();
select public.ensure_single_featured_project();

commit;
