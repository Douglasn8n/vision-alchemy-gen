-- Create required extensions
create extension if not exists pgcrypto;

-- Helper function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Subscribers table
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null unique,
  stripe_customer_id text,
  subscribed boolean not null default false,
  subscription_tier text,
  subscription_end timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

-- Users can view their own subscription info
create policy if not exists "select_own_subscription" on public.subscribers
for select using (user_id = auth.uid() or email = auth.email());

-- Trigger to keep updated_at fresh
create or replace trigger trg_subscribers_updated_at
before update on public.subscribers
for each row execute function public.update_updated_at_column();

create index if not exists idx_subscribers_user_id on public.subscribers(user_id);

-- Prompts table (history)
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  platform text not null,
  subject text not null,
  subject_details text,
  style text not null,
  artist text,
  composition text not null,
  aspect_ratio text,
  mood text,
  lighting text,
  camera text,
  quality text not null,
  creativity_level integer,
  negative_prompt text,
  generated_prompt text not null,
  created_at timestamptz not null default now()
);

alter table public.prompts enable row level security;

-- Policies for user-owned rows
create policy if not exists "prompts_select_own" on public.prompts
for select using (user_id = auth.uid());

create policy if not exists "prompts_insert_own" on public.prompts
for insert with check (user_id = auth.uid());

create policy if not exists "prompts_update_own" on public.prompts
for update using (user_id = auth.uid());

create policy if not exists "prompts_delete_own" on public.prompts
for delete using (user_id = auth.uid());

create index if not exists idx_prompts_user_id_created_at on public.prompts(user_id, created_at desc);

-- Daily usage tracking
create table if not exists public.user_limits (
  user_id uuid not null,
  date date not null default current_date,
  usage_count integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.user_limits enable row level security;

-- Users can see their own usage
create policy if not exists "user_limits_select_own" on public.user_limits
for select using (user_id = auth.uid());

-- Trigger to keep updated_at fresh
create or replace trigger trg_user_limits_updated_at
before update on public.user_limits
for each row execute function public.update_updated_at_column();

-- Function to compute limits based on subscription tier
create or replace function public.check_user_limit(p_user_id uuid)
returns json as $$
declare
  v_tier text;
  v_limit integer;
  v_usage integer;
  v_remaining integer;
  v_can boolean;
begin
  -- Determine tier from subscribers table; default to Free
  select coalesce(subscription_tier, 'Free')
    into v_tier
  from public.subscribers
  where user_id = p_user_id
  order by updated_at desc
  limit 1;

  v_limit := case
    when v_tier ilike 'Unlimited' then 1000
    when v_tier ilike 'Pro' then 100
    else 10
  end;

  -- Ensure a row exists for today
  insert into public.user_limits(user_id, date)
  values (p_user_id, current_date)
  on conflict (user_id, date) do nothing;

  select usage_count into v_usage
  from public.user_limits
  where user_id = p_user_id and date = current_date;

  v_remaining := greatest(v_limit - v_usage, 0);
  v_can := v_usage < v_limit;

  return json_build_object(
    'current_usage', v_usage,
    'daily_limit', v_limit,
    'remaining', v_remaining,
    'can_generate', v_can,
    'subscription_tier', v_tier
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Increment usage counter and return the new usage value
create or replace function public.increment_user_usage(p_user_id uuid)
returns integer as $$
declare
  v_info json;
  v_limit integer;
  v_usage integer;
begin
  v_info := public.check_user_limit(p_user_id);
  v_limit := (v_info->>'daily_limit')::integer;
  v_usage := (v_info->>'current_usage')::integer;

  if v_usage < v_limit then
    insert into public.user_limits(user_id, date, usage_count)
    values (p_user_id, current_date, 1)
    on conflict (user_id, date)
    do update set usage_count = public.user_limits.usage_count + 1, updated_at = now()
    returning usage_count into v_usage;
  end if;

  return v_usage;
end;
$$ language plpgsql security definer set search_path = public;