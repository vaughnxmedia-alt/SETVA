-- SETVA / Mont City Project — unified form intake
-- Run in Supabase SQL Editor (Mont City Project) or via Supabase CLI.

create extension if not exists "pgcrypto";

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  form_type text not null,
  site text not null default 'setva',
  status text not null default 'pending_review',
  contact_email text,
  contact_name text,
  payload jsonb not null default '{}'::jsonb,
  admin_data jsonb not null default '{}'::jsonb,
  post_event_data jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_status_email_at timestamptz
);

create index if not exists form_submissions_form_type_idx
  on public.form_submissions (form_type);

create index if not exists form_submissions_status_idx
  on public.form_submissions (status);

create index if not exists form_submissions_contact_email_idx
  on public.form_submissions (contact_email);

create index if not exists form_submissions_submitted_at_idx
  on public.form_submissions (submitted_at desc);

create or replace function public.set_form_submissions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists form_submissions_updated_at on public.form_submissions;

create trigger form_submissions_updated_at
before update on public.form_submissions
for each row
execute function public.set_form_submissions_updated_at();

-- Service role (SETVA server) bypasses RLS. Lock down anon/authenticated access.
alter table public.form_submissions enable row level security;

comment on table public.form_submissions is
  'Unified inbound forms from SETVA and related Mont City sites.';

comment on column public.form_submissions.form_type is
  'media_credentials | sponsor_deck | sponsor_intake | sponsor_checkout_confirmed | checkout';

comment on column public.form_submissions.payload is
  'Applicant-submitted fields (JSON).';

comment on column public.form_submissions.admin_data is
  'Internal review / credential fields (JSON).';

comment on column public.form_submissions.post_event_data is
  'Post-event reporting fields (JSON).';
