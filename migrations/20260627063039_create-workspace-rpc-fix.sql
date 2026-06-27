create or replace function public.create_workspace(workspace_name text, workspace_description text default '')
returns public.workspaces
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_workspace public.workspaces;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.workspaces (owner_id, name, description)
  values (
    auth.uid(),
    trim(workspace_name),
    coalesce(workspace_description, '')
  )
  returning * into new_workspace;

  return new_workspace;
end;
$$;
