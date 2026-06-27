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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  avatar_url text,
  bio text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'editor')),
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.workspace_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  name text not null,
  language text not null check (language in ('html', 'css', 'javascript')),
  content text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists workspace_invitations_pending_unique
on public.workspace_invitations (workspace_id, lower(email))
where status = 'pending';

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select lower(email)
  from auth.users
  where id = auth.uid();
$$;

create or replace function public.is_workspace_member(target_workspace_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = target_user_id
  );
$$;

create or replace function public.is_workspace_owner(target_workspace_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = target_user_id
      and role = 'owner'
  );
$$;

create or replace function public.can_edit_workspace(target_workspace_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = target_user_id
      and role in ('owner', 'editor')
  );
$$;

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    lower(new.email),
    coalesce(new.profile ->> 'name', split_part(new.email, '@', 1)),
    new.profile ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(excluded.name, public.profiles.name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists sync_profile_from_auth_user_trigger on auth.users;
create trigger sync_profile_from_auth_user_trigger
after insert or update on auth.users
for each row
execute function public.sync_profile_from_auth_user();

insert into public.profiles (id, email, name, avatar_url)
select
  u.id,
  lower(u.email),
  coalesce(u.profile ->> 'name', split_part(u.email, '@', 1)),
  u.profile ->> 'avatar_url'
from auth.users u
on conflict (id) do update
  set email = excluded.email,
      name = coalesce(excluded.name, public.profiles.name),
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
      updated_at = now();

create or replace function public.bootstrap_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role, invited_by)
  values (new.id, new.owner_id, 'owner', new.owner_id)
  on conflict (workspace_id, user_id) do update
    set role = 'owner',
        updated_at = now();

  insert into public.workspace_files (workspace_id, created_by, updated_by, name, language, content, sort_order)
  values
    (
      new.id,
      new.owner_id,
      new.owner_id,
      'index.html',
      'html',
      '<main class="app">' || E'\n' ||
      '  <h1>Collaborative Code Editor</h1>' || E'\n' ||
      '  <p>Start building together.</p>' || E'\n' ||
      '</main>',
      1
    ),
    (
      new.id,
      new.owner_id,
      new.owner_id,
      'styles.css',
      'css',
      ':root {' || E'\n' ||
      '  color-scheme: light;' || E'\n' ||
      '  font-family: Inter, system-ui, sans-serif;' || E'\n' ||
      '}' || E'\n' ||
      E'\n' ||
      'body {' || E'\n' ||
      '  margin: 0;' || E'\n' ||
      '  padding: 2rem;' || E'\n' ||
      '  background: linear-gradient(135deg, #f6efe7, #fff8f1);' || E'\n' ||
      '}' || E'\n' ||
      E'\n' ||
      '.app {' || E'\n' ||
      '  max-width: 40rem;' || E'\n' ||
      '  margin: 0 auto;' || E'\n' ||
      '}',
      2
    ),
    (
      new.id,
      new.owner_id,
      new.owner_id,
      'script.js',
      'javascript',
      'console.log("Workspace ready for live collaboration.");',
      3
    )
  on conflict (workspace_id, name) do nothing;

  return new;
end;
$$;

drop trigger if exists bootstrap_workspace_trigger on public.workspaces;
create trigger bootstrap_workspace_trigger
after insert on public.workspaces
for each row
execute function public.bootstrap_workspace();

create or replace function public.accept_workspace_invitation(invitation_id uuid)
returns public.workspace_invitations
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  invitation_row public.workspace_invitations;
  current_user_id uuid := auth.uid();
  current_email text := public.current_user_email();
begin
  select *
  into invitation_row
  from public.workspace_invitations
  where id = invitation_id
    and status = 'pending';

  if invitation_row.id is null then
    raise exception 'Invitation not found or already processed';
  end if;

  if invitation_row.expires_at < now() then
    raise exception 'Invitation expired';
  end if;

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if lower(invitation_row.email) <> current_email then
    raise exception 'Invitation email does not match the current user';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role, invited_by)
  values (invitation_row.workspace_id, current_user_id, invitation_row.role, invitation_row.invited_by)
  on conflict (workspace_id, user_id) do update
    set role = excluded.role,
        invited_by = excluded.invited_by,
        updated_at = now();

  update public.workspace_invitations
  set status = 'accepted',
      accepted_by = current_user_id,
      updated_at = now()
  where id = invitation_row.id
  returning * into invitation_row;

  return invitation_row;
end;
$$;

create or replace function public.decline_workspace_invitation(invitation_id uuid)
returns public.workspace_invitations
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  invitation_row public.workspace_invitations;
begin
  update public.workspace_invitations
  set status = 'declined',
      updated_at = now()
  where id = invitation_id
    and status = 'pending'
    and lower(email) = public.current_user_email()
  returning * into invitation_row;

  if invitation_row.id is null then
    raise exception 'Invitation not found or not accessible';
  end if;

  return invitation_row;
end;
$$;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_workspaces on public.workspaces;
create trigger set_updated_at_workspaces
before update on public.workspaces
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_workspace_members on public.workspace_members;
create trigger set_updated_at_workspace_members
before update on public.workspace_members
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_workspace_files on public.workspace_files;
create trigger set_updated_at_workspace_files
before update on public.workspace_files
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_workspace_invitations on public.workspace_invitations;
create trigger set_updated_at_workspace_invitations
before update on public.workspace_invitations
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_files enable row level security;
alter table public.workspace_invitations enable row level security;

create policy "profiles are visible to authenticated users"
on public.profiles
for select
to authenticated
using (true);

create policy "users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "authenticated users can create workspaces"
on public.workspaces
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "workspace members can read workspaces"
on public.workspaces
for select
to authenticated
using (public.is_workspace_member(id));

create policy "workspace owners can update workspaces"
on public.workspaces
for update
to authenticated
using (public.is_workspace_owner(id))
with check (public.is_workspace_owner(id));

create policy "workspace owners can delete workspaces"
on public.workspaces
for delete
to authenticated
using (public.is_workspace_owner(id));

create policy "workspace members can read memberships"
on public.workspace_members
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "workspace owners can manage memberships"
on public.workspace_members
for insert
to authenticated
with check (public.is_workspace_owner(workspace_id));

create policy "workspace owners can update memberships"
on public.workspace_members
for update
to authenticated
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

create policy "workspace owners can delete memberships"
on public.workspace_members
for delete
to authenticated
using (public.is_workspace_owner(workspace_id));

create policy "workspace members can read files"
on public.workspace_files
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy "workspace editors can insert files"
on public.workspace_files
for insert
to authenticated
with check (public.can_edit_workspace(workspace_id));

create policy "workspace editors can update files"
on public.workspace_files
for update
to authenticated
using (public.can_edit_workspace(workspace_id))
with check (public.can_edit_workspace(workspace_id));

create policy "workspace editors can delete files"
on public.workspace_files
for delete
to authenticated
using (public.can_edit_workspace(workspace_id));

create policy "workspace owners and invitees can read invitations"
on public.workspace_invitations
for select
to authenticated
using (
  public.is_workspace_owner(workspace_id)
  or lower(email) = public.current_user_email()
);

create policy "workspace owners can create invitations"
on public.workspace_invitations
for insert
to authenticated
with check (public.is_workspace_owner(workspace_id));

create policy "workspace owners can update invitations"
on public.workspace_invitations
for update
to authenticated
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

create policy "workspace owners can delete invitations"
on public.workspace_invitations
for delete
to authenticated
using (public.is_workspace_owner(workspace_id));

insert into realtime.channels (pattern, description, enabled)
values
  ('workspace:%', 'Workspace presence, member updates, and notifications', true),
  ('workspace:%:file:%', 'Workspace file collaboration channels', true)
on conflict (pattern) do update
  set description = excluded.description,
      enabled = excluded.enabled,
      updated_at = now();

alter table realtime.channels enable row level security;
alter table realtime.messages enable row level security;

create policy "workspace members can subscribe to realtime channels"
on realtime.channels
for select
to authenticated
using (
  split_part(realtime.channel_name(), ':', 1) = 'workspace'
  and public.is_workspace_member(nullif(split_part(realtime.channel_name(), ':', 2), '')::uuid)
);

create policy "workspace members can publish realtime messages"
on realtime.messages
for insert
to authenticated
with check (
  split_part(channel_name, ':', 1) = 'workspace'
  and public.is_workspace_member(nullif(split_part(channel_name, ':', 2), '')::uuid)
);
