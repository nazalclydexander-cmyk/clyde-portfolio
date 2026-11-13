-- Run this once in the Supabase SQL Editor after portfolio_profile_setup.sql.
alter table public.portfolio_profile
add column if not exists linkedin_url text;
