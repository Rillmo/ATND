create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  image_url text,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  email_verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists user_credentials (
  user_id uuid primary key references users(id) on delete cascade,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists email_verification_tokens_token_hash_idx
  on email_verification_tokens(token_hash);

create index if not exists email_verification_tokens_email_idx
  on email_verification_tokens(email, consumed_at);

do $$ begin
  create type member_role as enum ('MANAGER','MEMBER');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type attendance_status as enum ('NOT_ATTENDED','ATTENDED','ABSENT');
exception
  when duplicate_object then null;
end $$;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  invite_code text not null unique,
  manager_user_id uuid not null references users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role member_role not null,
  joined_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create unique index if not exists organization_members_manager_unique
  on organization_members(org_id)
  where role = 'MANAGER';

create index if not exists organization_members_user_id_idx
  on organization_members(user_id);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  event_date date not null,
  attendance_start_at timestamptz not null,
  attendance_end_at timestamptz not null,
  radius_meters integer not null check (radius_meters > 0),
  location_name text,
  location_address text,
  latitude double precision not null,
  longitude double precision not null,
  created_by uuid not null references users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists attendances (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  status attendance_status not null,
  checked_in_at timestamptz,
  checked_in_latitude double precision,
  checked_in_longitude double precision,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
