-- Run this once in Supabase SQL Editor.
alter table public.portfolio_profile
add column if not exists portrait_interaction_enabled boolean not null default true;
