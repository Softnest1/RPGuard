
-- Colonnes manquantes dans profiles
alter table profiles
  add column if not exists avatar_url   text,
  add column if not exists pseudo_rp    text,
  add column if not exists bio          text,
  add column if not exists reset_token_hash    text,
  add column if not exists reset_token_expires timestamptz;

-- Colonnes manquantes dans preuves (file_type nullable + user_id)
alter table preuves
  add column if not exists user_id uuid references profiles(id) on delete cascade;

-- Créer stats_global (dénormalisé)
create table if not exists stats_global (
  id           int primary key default 1,
  total_count  int not null default 0,
  server_count int not null default 0,
  user_count   int not null default 0,
  today_count  int not null default 0,
  won_count    int not null default 0,
  updated_at   timestamptz not null default now(),
  check (id = 1)
);
insert into stats_global(id) values (1) on conflict do nothing;
alter table stats_global enable row level security;

-- Créer notifications
create table if not exists notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        text not null,
  plainte_id  uuid references plaintes(id) on delete cascade,
  message     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table notifications enable row level security;
create index if not exists idx_notifications_user on notifications(user_id);

-- Helper is_admin (SECURITY DEFINER)
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Storage buckets
insert into storage.buckets (id, name, public) values ('preuves', 'preuves', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;

-- ── RLS : stats_global ─────────────────────────────────────────────
do $$ begin
  create policy "stats_select_all" on stats_global for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "stats_update_admin" on stats_global for update using (is_admin());
exception when duplicate_object then null; end $$;

-- ── RLS : notifications ────────────────────────────────────────────
do $$ begin
  create policy "notif_select_own" on notifications for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "notif_update_own" on notifications for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "notif_insert_admin" on notifications for insert with check (is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "notif_delete_own_or_admin" on notifications for delete using (auth.uid() = user_id or is_admin());
exception when duplicate_object then null; end $$;

-- ── Storage policies ───────────────────────────────────────────────
do $$ begin
  create policy "preuves_upload_auth" on storage.objects for insert with check (bucket_id = 'preuves' and auth.uid() is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "preuves_select_all" on storage.objects for select using (bucket_id = 'preuves');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "preuves_delete_own" on storage.objects for delete using (bucket_id = 'preuves' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "avatars_upload_auth" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid() is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "avatars_update_auth" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "avatars_select_all" on storage.objects for select using (bucket_id = 'avatars');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "avatars_delete_own" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;

-- Seed catégories si absentes
insert into categories (name, color) values
  ('Abus de pouvoir',       '#ef4444'),
  ('Bannissement injuste',  '#f97316'),
  ('Corruption',            '#eab308'),
  ('Harcèlement',           '#ec4899'),
  ('Triche / Favoritisme',  '#8b5cf6'),
  ('Manque de transparence','#06b6d4'),
  ('Non-respect des règles','#10b981'),
  ('Autre',                 '#6b7280')
on conflict (name) do nothing;
