-- نفّذ هذا الملف مرة واحدة داخل Supabase > SQL Editor.
-- ينشئ المجموعات والدعوات والرسائل مع حماية RLS.

create extension if not exists pgcrypto;

create table if not exists public.groups (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 1 and 60),
    description text check (description is null or char_length(description) <= 180),
    owner_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now()
);

create table if not exists public.group_members (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    role text not null default 'member' check (role in ('owner', 'member')),
    joined_at timestamptz not null default now(),
    unique (group_id, user_id)
);

create table if not exists public.group_invitations (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    inviter_id uuid not null references public.profiles(id) on delete cascade,
    invitee_id uuid not null references public.profiles(id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
    created_at timestamptz not null default now(),
    responded_at timestamptz,
    unique (group_id, invitee_id),
    check (inviter_id <> invitee_id)
);

create table if not exists public.group_messages (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    sender_id uuid not null references public.profiles(id) on delete cascade,
    message text not null check (char_length(message) between 1 and 1000),
    created_at timestamptz not null default now()
);

create index if not exists group_members_user_idx on public.group_members(user_id);
create index if not exists group_invitations_invitee_idx on public.group_invitations(invitee_id, status);
create index if not exists group_messages_group_time_idx on public.group_messages(group_id, created_at);

create or replace function public.is_group_member(target_group uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.group_members where group_id = target_group and user_id = target_user) $$;

create or replace function public.is_group_owner(target_group uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.groups where id = target_group and owner_id = target_user) $$;

create or replace function public.can_view_group(target_group uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$
    select
        exists(select 1 from public.group_members where group_id = target_group and user_id = target_user)
        or exists(select 1 from public.group_invitations where group_id = target_group and invitee_id = target_user and status = 'pending')
$$;

grant execute on function public.is_group_member(uuid, uuid) to authenticated;
grant execute on function public.is_group_owner(uuid, uuid) to authenticated;
grant execute on function public.can_view_group(uuid, uuid) to authenticated;

create or replace function public.add_group_owner()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
    insert into public.group_members(group_id, user_id, role) values(new.id, new.owner_id, 'owner');
    return new;
end;
$$;

drop trigger if exists add_group_owner_after_insert on public.groups;
create trigger add_group_owner_after_insert after insert on public.groups
for each row execute function public.add_group_owner();

create or replace function public.accept_group_invitation()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
    if old.status = 'pending' and new.status = 'accepted' then
        insert into public.group_members(group_id, user_id, role)
        values(new.group_id, new.invitee_id, 'member')
        on conflict (group_id, user_id) do nothing;
    end if;
    return new;
end;
$$;

drop trigger if exists accept_group_invitation_after_update on public.group_invitations;
create trigger accept_group_invitation_after_update after update of status on public.group_invitations
for each row execute function public.accept_group_invitation();

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invitations enable row level security;
alter table public.group_messages enable row level security;

drop policy if exists "members view groups" on public.groups;
create policy "members view groups" on public.groups for select to authenticated using (public.can_view_group(id));
drop policy if exists "users create groups" on public.groups;
create policy "users create groups" on public.groups for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "owners update groups" on public.groups;
create policy "owners update groups" on public.groups for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "owners delete groups" on public.groups;
create policy "owners delete groups" on public.groups for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "members view memberships" on public.group_members;
create policy "members view memberships" on public.group_members for select to authenticated using (public.is_group_member(group_id));

drop policy if exists "people view their invitations" on public.group_invitations;
create policy "people view their invitations" on public.group_invitations for select to authenticated using (invitee_id = auth.uid() or public.is_group_owner(group_id));
drop policy if exists "owners create invitations" on public.group_invitations;
create policy "owners create invitations" on public.group_invitations for insert to authenticated with check (inviter_id = auth.uid() and public.is_group_owner(group_id));
drop policy if exists "invitees or owners update invitations" on public.group_invitations;
create policy "invitees or owners update invitations" on public.group_invitations for update to authenticated using (invitee_id = auth.uid() or public.is_group_owner(group_id)) with check (invitee_id = auth.uid() or public.is_group_owner(group_id));

drop policy if exists "members view group messages" on public.group_messages;
create policy "members view group messages" on public.group_messages for select to authenticated using (public.is_group_member(group_id));
drop policy if exists "members send group messages" on public.group_messages;
create policy "members send group messages" on public.group_messages for insert to authenticated with check (sender_id = auth.uid() and public.is_group_member(group_id));

do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'group_messages'
    ) then
        alter publication supabase_realtime add table public.group_messages;
    end if;
end $$;
