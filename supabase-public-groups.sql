-- نفّذ هذا الملف مرة واحدة داخل Supabase > SQL Editor.
-- يضيف المجموعات العامة مع الحفاظ على المجموعات القديمة كخاصة.

alter table public.groups
add column if not exists is_public boolean not null default false;

create index if not exists groups_public_created_idx
on public.groups(is_public, created_at desc);

create or replace function public.create_learning_group(
    group_name text,
    group_description text default null,
    group_is_public boolean default false
)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
    new_group_id uuid;
begin
    if auth.uid() is null then
        raise exception 'يجب تسجيل الدخول أولًا';
    end if;
    if char_length(trim(group_name)) < 1 or char_length(trim(group_name)) > 60 then
        raise exception 'اسم المجموعة يجب أن يكون بين 1 و60 حرفًا';
    end if;
    if group_description is not null and char_length(group_description) > 180 then
        raise exception 'وصف المجموعة طويل جدًا';
    end if;

    insert into public.groups(name, description, owner_id, is_public)
    values(trim(group_name), nullif(trim(group_description), ''), auth.uid(), coalesce(group_is_public, false))
    returning id into new_group_id;

    return new_group_id;
end;
$$;

revoke all on function public.create_learning_group(text, text, boolean) from public;
grant execute on function public.create_learning_group(text, text, boolean) to authenticated;

create or replace function public.join_public_group(target_group uuid)
returns boolean language plpgsql security definer set search_path = public
as $$
begin
    if auth.uid() is null then
        raise exception 'يجب تسجيل الدخول أولًا';
    end if;
    if not exists(select 1 from public.groups where id = target_group and is_public = true) then
        raise exception 'هذه المجموعة ليست عامة أو لم تعد موجودة';
    end if;

    insert into public.group_members(group_id, user_id, role)
    values(target_group, auth.uid(), 'member')
    on conflict (group_id, user_id) do nothing;
    return true;
end;
$$;

revoke all on function public.join_public_group(uuid) from public;
grant execute on function public.join_public_group(uuid) to authenticated;

drop policy if exists "members view groups" on public.groups;
drop policy if exists "members or public view groups" on public.groups;
create policy "members or public view groups" on public.groups
for select to authenticated
using (is_public = true or owner_id = auth.uid() or public.can_view_group(id));

-- السماح لزوار الصفحة الرئيسية برؤية أسماء المجموعات العامة فقط.
grant usage on schema public to anon;
grant select on public.groups to anon;
drop policy if exists "visitors view public groups" on public.groups;
create policy "visitors view public groups" on public.groups
for select to anon
using (is_public = true);

notify pgrst, 'reload schema';
