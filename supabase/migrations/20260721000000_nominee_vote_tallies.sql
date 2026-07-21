-- Vote tallies for Headquarters — one row per nominee, not one row per vote.
-- Individual nominee_votes rows can number in the millions during a voting blast.
-- HQ (and leaders) only need: votes per nominee + category totals derived from those.

create table if not exists public.nominee_vote_tally_cache (
  nominee_id text primary key,
  votes bigint not null default 0 check (votes >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.nominee_vote_tally_cache is
  'Per-nominee vote counts for HQ Voting. Category totals are summed from these rows in the app.';

alter table public.nominee_vote_tally_cache enable row level security;

revoke all on table public.nominee_vote_tally_cache from public;
grant select, insert, update, delete on table public.nominee_vote_tally_cache to service_role;

-- Rebuild the cache from form_submissions.nominee_votes submitted on/after `since`.
-- Safe to re-run; replaces the full cache atomically.
create or replace function public.refresh_nominee_vote_tally_cache(since timestamptz)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  row_count bigint;
begin
  delete from public.nominee_vote_tally_cache;

  insert into public.nominee_vote_tally_cache (nominee_id, votes, updated_at)
  select
    payload->>'nomineeId' as nominee_id,
    count(*)::bigint as votes,
    now() as updated_at
  from public.form_submissions
  where form_type = 'nominee_votes'
    and submitted_at >= since
    and coalesce(payload->>'nomineeId', '') <> ''
  group by payload->>'nomineeId';

  get diagnostics row_count = row_count;
  return row_count;
end;
$$;

comment on function public.refresh_nominee_vote_tally_cache(timestamptz) is
  'Rebuilds nominee_vote_tally_cache from countable nominee_votes. Returns number of nominee rows.';

revoke execute on function public.refresh_nominee_vote_tally_cache(timestamptz) from public;
grant execute on function public.refresh_nominee_vote_tally_cache(timestamptz) to service_role;

-- Atomically bump one nominee's cached count when a vote is recorded.
create or replace function public.increment_nominee_vote_tally(p_nominee_id text, p_delta bigint default 1)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_votes bigint;
begin
  if coalesce(p_nominee_id, '') = '' then
    return 0;
  end if;

  insert into public.nominee_vote_tally_cache (nominee_id, votes, updated_at)
  values (p_nominee_id, greatest(p_delta, 0), now())
  on conflict (nominee_id) do update
    set votes = public.nominee_vote_tally_cache.votes + excluded.votes,
        updated_at = now()
  returning votes into new_votes;

  return new_votes;
end;
$$;

revoke execute on function public.increment_nominee_vote_tally(text, bigint) from public;
grant execute on function public.increment_nominee_vote_tally(text, bigint) to service_role;

-- Supporting index for refresh (and any future tally queries).
create index if not exists form_submissions_nominee_votes_tally_idx
  on public.form_submissions ((payload->>'nomineeId'), submitted_at)
  where form_type = 'nominee_votes';

-- Keep the older RPC name as a thin read of the cache (backward compatible).
create or replace function public.nominee_vote_tallies(since timestamptz default null)
returns table (nominee_id text, votes bigint)
language sql
stable
security definer
set search_path = public
as $$
  select c.nominee_id, c.votes
  from public.nominee_vote_tally_cache c
  order by c.votes desc, c.nominee_id;
$$;

revoke execute on function public.nominee_vote_tallies(timestamptz) from public;
grant execute on function public.nominee_vote_tallies(timestamptz) to service_role;
