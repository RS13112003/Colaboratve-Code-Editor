create extension if not exists pgcrypto;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  language text not null,
  content text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.documents (title, language, content, is_published)
values
  (
    'Realtime Cursor Sync',
    'typescript',
    'export function syncCursor(userId: string, position: number) { return { userId, position }; }',
    true
  ),
  (
    'Presence Channel Demo',
    'javascript',
    'const channelName = "editor:presence"; console.log(`joining ${channelName}`);',
    false
  ),
  (
    'Starter SQL Snippet',
    'sql',
    'select id, title, language from public.documents order by created_at desc;',
    true
  );
