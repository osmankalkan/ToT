-- ThisOrThat (ToT) – Supabase şeması
-- Supabase Dashboard > SQL Editor'de TEK SEFERDE çalıştırılabilir.
-- ToT.md bölüm 4'e göre yazıldı; spec'e eklenen kısımlar "[EK]" ile işaretli.

-- =========================================================
-- 4.1 Tablolar
-- =========================================================

-- [EK] Supabase önerisi: eklentiler "extensions" şemasına kurulur (public'e değil)
create extension if not exists citext with schema extensions;

-- Kullanıcı profilleri (kullanıcı adı burada)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext unique not null
    check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

-- Anketler
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question text not null check (char_length(question) between 3 and 200),
  created_at timestamptz not null default now()
);
create index polls_created_at_idx on public.polls (created_at desc);

-- Seçenekler
create table public.options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 100),
  image_url text,
  position smallint not null check (position between 1 and 5),
  unique (poll_id, position),
  unique (id, poll_id)
);

-- Oylar (bir kullanıcı bir ankete 1 oy; seçenek mutlaka o ankete ait olmalı)
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null,
  option_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id),
  foreign key (option_id, poll_id)
    references public.options (id, poll_id) on delete cascade
);
create index votes_poll_id_idx on public.votes (poll_id);

-- =========================================================
-- 4.2 Kayıtta profil oluşturan trigger
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- 4.3 Oy sayıları view'u
-- Bilinçli olarak security_invoker KAPALI: view sahibinin yetkisiyle çalışır,
-- böylece votes RLS'ine takılmadan sadece TOPLAMLAR herkese açılır.
-- (Supabase linter "security_definer_view" uyarısı verir; bu kasıtlıdır.)
-- =========================================================
create view public.option_vote_counts as
select option_id, poll_id, count(*)::int as vote_count
from public.votes
group by option_id, poll_id;

grant select on public.option_vote_counts to anon, authenticated;

-- =========================================================
-- 4.4 Anketi atomik oluşturan fonksiyon
-- =========================================================
create or replace function public.create_poll(p_question text, p_options jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_poll_id uuid;
  v_count int;
  v_opt jsonb;
  i int := 0;
begin
  -- [EK] Anlaşılır hata mesajları
  if auth.uid() is null then
    raise exception 'Anket oluşturmak için giriş yapmalısın';
  end if;

  if p_options is null or jsonb_typeof(p_options) <> 'array' then
    raise exception 'Seçenekler bir liste olmalı';
  end if;

  v_count := jsonb_array_length(p_options);
  if v_count < 2 or v_count > 5 then
    raise exception 'Seçenek sayısı 2 ile 5 arasında olmalı';
  end if;

  insert into polls (user_id, question)
  values (auth.uid(), p_question)
  returning id into v_poll_id;

  for v_opt in select * from jsonb_array_elements(p_options) loop
    i := i + 1;
    insert into options (poll_id, text, image_url, position)
    values (v_poll_id, v_opt->>'text', v_opt->>'image_url', i);
  end loop;

  return v_poll_id;
end;
$$;

-- [EK] Supabase yeni fonksiyonları varsayılan olarak anon'a da açar; sadece giriş yapanlar çağırsın
revoke execute on function public.create_poll(text, jsonb) from public, anon;
grant execute on function public.create_poll(text, jsonb) to authenticated;

-- =========================================================
-- [EK] Tablo yetkileri
-- Yeni Supabase projelerinde tablolar Data API'ye otomatik açılmayabilir.
-- Zaten açıksa bu satırlar zararsızdır. Asıl koruma RLS'tedir.
-- =========================================================
grant select on public.profiles, public.polls, public.options to anon, authenticated;
grant insert, delete on public.polls to authenticated;
grant insert on public.options to authenticated;
grant select, insert on public.votes to authenticated;

-- =========================================================
-- 4.5 Row Level Security (ZORUNLU)
-- =========================================================
alter table public.profiles enable row level security;
alter table public.polls    enable row level security;
alter table public.options  enable row level security;
alter table public.votes    enable row level security;

-- profiles: herkes okuyabilir (kullanıcı adı gösterimi + müsaitlik kontrolü)
create policy "profiles_select_all" on public.profiles
  for select using (true);

-- polls: herkes okur, giriş yapan kendi adına ekler, sahibi siler
create policy "polls_select_all" on public.polls
  for select using (true);
create policy "polls_insert_own" on public.polls
  for insert to authenticated with check (auth.uid() = user_id);
create policy "polls_delete_own" on public.polls
  for delete to authenticated using (auth.uid() = user_id);

-- options: herkes okur, sadece anket sahibi ekler
create policy "options_select_all" on public.options
  for select using (true);
create policy "options_insert_poll_owner" on public.options
  for insert to authenticated
  with check (exists (
    select 1 from public.polls p
    where p.id = poll_id and p.user_id = auth.uid()
  ));

-- votes: kullanıcı sadece KENDİ oylarını görür ve sadece kendi adına oy ekler
create policy "votes_select_own" on public.votes
  for select to authenticated using (auth.uid() = user_id);
create policy "votes_insert_own" on public.votes
  for insert to authenticated with check (auth.uid() = user_id);

-- =========================================================
-- 4.6 Storage (anket görselleri) – yol: {user_id}/{uuid}.{uzantı}
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('poll-images', 'poll-images', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "poll_images_public_read" on storage.objects
  for select using (bucket_id = 'poll-images');

create policy "poll_images_upload_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'poll-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- [EK] Kullanıcı kendi klasöründeki görseli silebilsin (anket silinince yetim dosya kalmasın)
create policy "poll_images_delete_own_folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'poll-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
