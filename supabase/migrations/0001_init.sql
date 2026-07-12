-- AI食事記録 初期スキーマ
-- 参照: SPECIFICATION.md 5章 データベース設計

-- ============================================================
-- users（プロフィール）
-- ============================================================
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  target_calorie_kcal integer not null default 2000,
  target_protein_g numeric(6, 1) not null default 60,
  target_fat_g numeric(6, 1) not null default 60,
  target_carbohydrate_g numeric(6, 1) not null default 300,
  target_salt_g numeric(4, 1) not null default 7.5,
  target_weight_kg numeric(5, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- auth.users 作成時に public.users を自動作成する
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- meals（食事記録）
-- ============================================================
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  eaten_at timestamptz not null,
  meal_type text not null check (meal_type in ('朝食', '昼食', '夕食', '間食')),
  meal_timing text check (meal_timing in ('朝', '昼', '夜', '深夜')),
  menu_name text not null,
  category text,
  serving_size text,
  calorie_kcal numeric(7, 1) not null check (calorie_kcal >= 0),
  protein_g numeric(6, 1) not null default 0 check (protein_g >= 0),
  fat_g numeric(6, 1) not null default 0 check (fat_g >= 0),
  carbohydrate_g numeric(6, 1) not null default 0 check (carbohydrate_g >= 0),
  fiber_g numeric(6, 1) default 0,
  salt_g numeric(5, 2) default 0,
  confidence integer check (confidence between 0 and 100),
  evaluation text,
  advice text,
  photo_url text,
  raw_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meals_user_eaten_idx on public.meals (user_id, eaten_at desc);
create index meals_user_type_idx on public.meals (user_id, meal_type);

-- ============================================================
-- ingredients（食材・正規化）
-- ============================================================
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index ingredients_meal_idx on public.ingredients (meal_id);
create index ingredients_user_name_idx on public.ingredients (user_id, name);

-- ============================================================
-- weight_logs（体重記録）
-- ============================================================
create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  recorded_on date not null,
  weight_kg numeric(5, 2) not null check (weight_kg > 0),
  body_fat_percent numeric(4, 1) check (body_fat_percent between 0 and 100),
  note text,
  created_at timestamptz not null default now(),
  constraint weight_logs_user_date_uniq unique (user_id, recorded_on)
);

create index weight_logs_user_date_idx on public.weight_logs (user_id, recorded_on desc);

-- ============================================================
-- daily_summaries（日次集計キャッシュ）
-- ============================================================
create table public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  summary_date date not null,
  total_calorie_kcal numeric(8, 1) not null default 0,
  total_protein_g numeric(7, 1) not null default 0,
  total_fat_g numeric(7, 1) not null default 0,
  total_carbohydrate_g numeric(7, 1) not null default 0,
  total_fiber_g numeric(7, 1) not null default 0,
  total_salt_g numeric(6, 2) not null default 0,
  meal_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint daily_summaries_user_date_uniq unique (user_id, summary_date)
);

create index daily_summaries_user_date_idx on public.daily_summaries (user_id, summary_date desc);

-- meals の変更を検知して daily_summaries を再計算するトリガー
create function public.refresh_daily_summary()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_user_id uuid;
  target_date date;
begin
  if tg_op = 'DELETE' then
    target_user_id := old.user_id;
    target_date := (old.eaten_at at time zone 'Asia/Tokyo')::date;
  else
    target_user_id := new.user_id;
    target_date := (new.eaten_at at time zone 'Asia/Tokyo')::date;
  end if;

  insert into public.daily_summaries (
    user_id, summary_date, total_calorie_kcal, total_protein_g,
    total_fat_g, total_carbohydrate_g, total_fiber_g, total_salt_g,
    meal_count, updated_at
  )
  select
    target_user_id,
    target_date,
    coalesce(sum(calorie_kcal), 0),
    coalesce(sum(protein_g), 0),
    coalesce(sum(fat_g), 0),
    coalesce(sum(carbohydrate_g), 0),
    coalesce(sum(fiber_g), 0),
    coalesce(sum(salt_g), 0),
    count(*),
    now()
  from public.meals
  where user_id = target_user_id
    and (eaten_at at time zone 'Asia/Tokyo')::date = target_date
  on conflict (user_id, summary_date) do update set
    total_calorie_kcal = excluded.total_calorie_kcal,
    total_protein_g = excluded.total_protein_g,
    total_fat_g = excluded.total_fat_g,
    total_carbohydrate_g = excluded.total_carbohydrate_g,
    total_fiber_g = excluded.total_fiber_g,
    total_salt_g = excluded.total_salt_g,
    meal_count = excluded.meal_count,
    updated_at = excluded.updated_at;

  -- UPDATE で日付をまたいだ場合、旧日付分も再計算する
  if tg_op = 'UPDATE' and (old.eaten_at at time zone 'Asia/Tokyo')::date <> target_date then
    insert into public.daily_summaries (
      user_id, summary_date, total_calorie_kcal, total_protein_g,
      total_fat_g, total_carbohydrate_g, total_fiber_g, total_salt_g,
      meal_count, updated_at
    )
    select
      old.user_id,
      (old.eaten_at at time zone 'Asia/Tokyo')::date,
      coalesce(sum(calorie_kcal), 0),
      coalesce(sum(protein_g), 0),
      coalesce(sum(fat_g), 0),
      coalesce(sum(carbohydrate_g), 0),
      coalesce(sum(fiber_g), 0),
      coalesce(sum(salt_g), 0),
      count(*),
      now()
    from public.meals
    where user_id = old.user_id
      and (eaten_at at time zone 'Asia/Tokyo')::date = (old.eaten_at at time zone 'Asia/Tokyo')::date
    on conflict (user_id, summary_date) do update set
      total_calorie_kcal = excluded.total_calorie_kcal,
      total_protein_g = excluded.total_protein_g,
      total_fat_g = excluded.total_fat_g,
      total_carbohydrate_g = excluded.total_carbohydrate_g,
      total_fiber_g = excluded.total_fiber_g,
      total_salt_g = excluded.total_salt_g,
      meal_count = excluded.meal_count,
      updated_at = excluded.updated_at;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger meals_refresh_daily_summary
  after insert or update or delete on public.meals
  for each row execute function public.refresh_daily_summary();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.users enable row level security;
alter table public.meals enable row level security;
alter table public.ingredients enable row level security;
alter table public.weight_logs enable row level security;
alter table public.daily_summaries enable row level security;

-- users: id が本人の行のみ
create policy "own row select" on public.users
  for select using (auth.uid() = id);
create policy "own row insert" on public.users
  for insert with check (auth.uid() = id);
create policy "own row update" on public.users
  for update using (auth.uid() = id);

-- meals
create policy "own rows select" on public.meals
  for select using (auth.uid() = user_id);
create policy "own rows insert" on public.meals
  for insert with check (auth.uid() = user_id);
create policy "own rows update" on public.meals
  for update using (auth.uid() = user_id);
create policy "own rows delete" on public.meals
  for delete using (auth.uid() = user_id);

-- ingredients
create policy "own rows select" on public.ingredients
  for select using (auth.uid() = user_id);
create policy "own rows insert" on public.ingredients
  for insert with check (auth.uid() = user_id);
create policy "own rows update" on public.ingredients
  for update using (auth.uid() = user_id);
create policy "own rows delete" on public.ingredients
  for delete using (auth.uid() = user_id);

-- weight_logs
create policy "own rows select" on public.weight_logs
  for select using (auth.uid() = user_id);
create policy "own rows insert" on public.weight_logs
  for insert with check (auth.uid() = user_id);
create policy "own rows update" on public.weight_logs
  for update using (auth.uid() = user_id);
create policy "own rows delete" on public.weight_logs
  for delete using (auth.uid() = user_id);

-- daily_summaries（トリガー経由のみ書き込み想定だが、RLSはselectのみ許可）
create policy "own rows select" on public.daily_summaries
  for select using (auth.uid() = user_id);
