import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL_KEY = "fth_supabase_url";
const ANON_KEY = "fth_supabase_anon";

let client: SupabaseClient | null = null;
let currentUrl = "";
let currentAnon = "";

export function getSupabaseConfig(): { url: string; anonKey: string } {
  try {
    return {
      url: localStorage.getItem(URL_KEY) ?? "",
      anonKey: localStorage.getItem(ANON_KEY) ?? "",
    };
  } catch {
    return { url: "", anonKey: "" };
  }
}

export function setSupabaseConfig(url: string, anonKey: string) {
  try {
    localStorage.setItem(URL_KEY, url.trim());
    localStorage.setItem(ANON_KEY, anonKey.trim());
    client = null; // force re-init
  } catch { /* noop */ }
}

export function isSupabaseReady(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return url.length > 0 && anonKey.length > 0;
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseReady()) return null;
  const { url, anonKey } = getSupabaseConfig();
  if (client && url === currentUrl && anonKey === currentAnon) return client;
  currentUrl = url;
  currentAnon = anonKey;
  client = createClient(url, anonKey);
  return client;
}

export const SQL_SCHEMA = `
-- 家庭成员表
create table if not exists members (
  id text primary key,
  name text not null,
  avatar text default '',
  avatar_color text default '#E08A2A',
  password text not null default '0000',
  bio text default '',
  join_date text default '',
  created_at timestamptz default now()
);

-- 圈圈动态表
create table if not exists circle_posts (
  id text primary key,
  user_id text not null,
  author_name text not null,
  author_color text default '',
  author_avatar text default '',
  text text default '',
  images jsonb default '[]'::jsonb,
  date text default '',
  likes jsonb default '[]'::jsonb,
  comments jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 用户教程表
create table if not exists user_tutorials (
  id text primary key,
  user_id text not null,
  title text not null,
  category text default '',
  cover_prompt text default '',
  cover_size text default 'landscape_16_9',
  tags jsonb default '[]'::jsonb,
  author text not null,
  author_role text default '家人',
  avatar_color text default '',
  date text default '',
  intro text default '',
  steps jsonb default '[]'::jsonb,
  comments jsonb default '[]'::jsonb,
  likes integer default 0,
  created_at timestamptz default now()
);

-- 站点设置表（单行）
create table if not exists site_settings (
  id text primary key default 'singleton',
  data jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- 启用实时订阅
alter publication supabase_realtime add table if exists circle_posts;
alter publication supabase_realtime add table if exists members;
alter publication supabase_realtime add table if exists user_tutorials;

-- 允许匿名访问（家庭站点，无安全要求）
alter table members enable row level security;
alter table circle_posts enable row level security;
alter table user_tutorials enable row level security;
alter table site_settings enable row level security;

create policy "all access" on members for all using (true) with check (true);
create policy "all access" on circle_posts for all using (true) with check (true);
create policy "all access" on user_tutorials for all using (true) with check (true);
create policy "all access" on site_settings for all using (true) with check (true);
`;
