-- Efficient ticket-partner click/purchase tallies for Headquarters.
-- Avoid downloading every ticket_link_events row (~tens of thousands) into the app.

create index if not exists form_submissions_ticket_link_events_slug_idx
  on public.form_submissions ((payload->>'slug'), submitted_at desc)
  where form_type = 'ticket_link_events';

create or replace function public.ticket_link_event_tallies()
returns table (
  slug text,
  clicks bigint,
  purchases bigint,
  last_click_at timestamptz,
  last_purchase_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    payload->>'slug' as slug,
    count(*) filter (where payload->>'eventType' = 'click')::bigint as clicks,
    count(*) filter (where payload->>'eventType' = 'purchase')::bigint as purchases,
    max(submitted_at) filter (where payload->>'eventType' = 'click') as last_click_at,
    max(submitted_at) filter (where payload->>'eventType' = 'purchase') as last_purchase_at
  from public.form_submissions
  where form_type = 'ticket_link_events'
    and coalesce(payload->>'slug', '') <> ''
  group by payload->>'slug';
$$;

comment on function public.ticket_link_event_tallies() is
  'Per-slug click/purchase tallies for ticket partner links. Used by Headquarters instead of loading individual event rows.';

revoke execute on function public.ticket_link_event_tallies() from public;
grant execute on function public.ticket_link_event_tallies() to service_role;
