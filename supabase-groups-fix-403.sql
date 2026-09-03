-- إصلاح خطأ 403 فقط. آمن على البيانات الموجودة.
-- نفّذه مرة واحدة في Supabase > SQL Editor.

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.groups to authenticated;
grant select, insert, update, delete on table public.group_members to authenticated;
grant select, insert, update, delete on table public.group_invitations to authenticated;
grant select, insert, update, delete on table public.group_messages to authenticated;

grant execute on function public.is_group_member(uuid, uuid) to authenticated;
grant execute on function public.is_group_owner(uuid, uuid) to authenticated;
grant execute on function public.can_view_group(uuid, uuid) to authenticated;

-- إنشاء آمن للمجموعة باسم المستخدم المسجل، مع تجاوز تعارض RLS الداخلي فقط.
create or replace function public.create_learning_group(group_name text, group_description text default null)
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

    insert into public.groups(name, description, owner_id)
    values(trim(group_name), nullif(trim(group_description), ''), auth.uid())
    returning id into new_group_id;

    return new_group_id;
end;
$$;

revoke all on function public.create_learning_group(text, text) from public;
grant execute on function public.create_learning_group(text, text) to authenticated;

-- التأكد من أن الاستدعاء يعمل بصلاحيات مالك الدالة وليس بصلاحيات المتصفح.
alter function public.create_learning_group(text, text) security definer;

-- طلب تحديث مخطط PostgREST بعد تعديل الصلاحيات.
notify pgrst, 'reload schema';
