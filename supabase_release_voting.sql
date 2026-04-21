create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.release_polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  status text not null default 'live' check (status in ('draft', 'live', 'ended')),
  is_current boolean not null default false,
  start_at timestamp without time zone not null,
  end_at timestamp without time zone not null,
  places_count integer not null default 12 check (places_count between 1 and 20),
  songs_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamp without time zone
);

create unique index if not exists release_polls_only_one_current_idx
on public.release_polls ((is_current))
where is_current = true;

drop trigger if exists trg_release_polls_updated_at on public.release_polls;
create trigger trg_release_polls_updated_at
before update on public.release_polls
for each row
execute function public.set_updated_at();

create table if not exists public.release_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.release_polls(id) on delete cascade,
  juror_name text not null,
  juror_instagram text,
  ranking_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_release_votes_updated_at on public.release_votes;
create trigger trg_release_votes_updated_at
before update on public.release_votes
for each row
execute function public.set_updated_at();
