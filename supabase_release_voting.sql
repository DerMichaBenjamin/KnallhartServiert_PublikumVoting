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

create table if not exists public.release_voting_rounds (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  status text not null default 'live' check (status in ('draft', 'live', 'ended')),
  start_at timestamp without time zone not null,
  end_at timestamp without time zone not null,
  places_count integer not null default 12 check (places_count between 1 and 50),
  is_current boolean not null default false,
  songs_json jsonb not null default '[]'::jsonb,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  ended_at timestamp without time zone
);

create unique index if not exists release_voting_rounds_only_one_current_idx
on public.release_voting_rounds ((is_current))
where is_current = true;

create table if not exists public.release_voting_votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.release_voting_rounds(id) on delete cascade,
  juror_name text,
  juror_email text,
  juror_instagram text,
  ranking_json jsonb not null default '[]'::jsonb,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

alter table public.release_voting_rounds enable row level security;
alter table public.release_voting_votes enable row level security;

drop trigger if exists trg_release_voting_rounds_updated_at on public.release_voting_rounds;
create trigger trg_release_voting_rounds_updated_at
before update on public.release_voting_rounds
for each row
execute function public.set_updated_at();

drop trigger if exists trg_release_voting_votes_updated_at on public.release_voting_votes;
create trigger trg_release_voting_votes_updated_at
before update on public.release_voting_votes
for each row
execute function public.set_updated_at();
