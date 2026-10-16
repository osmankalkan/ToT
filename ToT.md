# ThisOrThat (ToT)

Kararsız kalan kullanıcıların bir soru ve 2-5 seçenek paylaşıp diğer kullanıcılardan oy topladığı **basit ve hızlı bir MVP** sosyal anket uygulaması.

Örnek: "Bugün sinemaya mı gitsem, restorana mı?" → seçenekler: Sinema / Restoran → diğer kullanıcılar oy verir.

---

## 1. Senin Rolün

Deneyimli bir Full-Stack geliştiricisin. **En sade, okunabilir ve modüler** kodu yazarsın. Gereksiz soyutlama (over-engineering) yapma. Bir seferde tek adım ilerle, her adımın sonunda ne yaptığını kısaca özetle ve bir sonraki adımı öner. Ben onaylamadan sonraki adıma geçme.

---

## 2. Tech Stack (SABİT, dışına çıkma)

| Alan | Teknoloji |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| State | Sadece React Hooks (`useState`, `useEffect`) |
| UI | Tailwind CSS + `lucide-react` |
| Backend/DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth, **sadece e-posta + şifre** |
| Dosya | Supabase Storage (anket görselleri) |
| Paketler | `@supabase/supabase-js`, `@supabase/ssr` |
| Deploy | Vercel |

**YASAK:** Redux, Zustand, React Query, SWR, Framer Motion, UI component kütüphaneleri (shadcn, MUI vb.), ORM'ler (Prisma, Drizzle), form kütüphaneleri. Animasyon sadece Tailwind ile (`transition-all duration-500`).

---

## 3. Kapsam (MVP)

### Var
1. **Kayıt / Giriş:** e-posta + şifre + **zorunlu kullanıcı adı**. Kullanıcı adı: benzersiz, 3-20 karakter, sadece harf/rakam/alt çizgi (büyük-küçük harf duyarsız).
2. **Feed:** Ana sayfada en yeni anketler alt alta. 10'ar yüklenir, "Daha fazla yükle" butonu vardır. Giriş yapmadan da görülebilir.
3. **Anket oluşturma:** Soru (3-200 karakter) + **en az 2, en fazla 5** seçenek (metin 1-100 karakter, opsiyonel görsel). Sadece giriş yapmış kullanıcı.
4. **Oy verme:** Seçeneğe tıklanır, oy kaydedilir, hemen ardından yüzdeler (ör. %60 - %40) bar animasyonuyla gösterilir. Sonuçlar oy verilmeden önce UI'da gösterilmez.
5. **Tek oy kuralı:** Bir kullanıcı bir ankete 1 kez oy verir, **değiştiremez**. (DB `unique` kısıtıyla garanti edilir.)
6. **Anket silme:** Sadece anket sahibi kendi anketini silebilir.
7. Her anketin altında sahibinin **kullanıcı adı** ve ne kadar önce açıldığı görünür.
8. Anket sahibi kendi anketine de oy verebilir.

### Yok (yapma)
- Takip (follow) sistemi, arkadaşlık, bildirim
- Yorum, beğeni, paylaşım
- Profil sayfası, kullanıcı arama
- Anket süresi/kapanma, oy değiştirme
- Google / sosyal giriş (sonraya bırakıldı)
- Admin paneli, raporlama (sonraya bırakıldı)

---

## 4. Veritabanı (Supabase SQL Editor'de sırayla çalıştırılacak)

### 4.1 Tablolar

```sql
create extension if not exists citext;

-- Kullanıcı profilleri (kullanıcı adı burada)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique not null
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
```

### 4.2 Kayıtta profil oluşturan trigger

Kayıt sırasında kullanıcı adı `options.data.username` ile gönderilir (bkz. bölüm 6).

```sql
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
```

### 4.3 Oy sayıları için view (kimin ne oy verdiği gizli kalır, sadece toplamlar açık)

```sql
create view public.option_vote_counts as
select option_id, poll_id, count(*)::int as vote_count
from public.votes
group by option_id, poll_id;

grant select on public.option_vote_counts to anon, authenticated;
```

### 4.4 Anketi atomik oluşturan fonksiyon (2-5 seçenek kuralı burada zorlanır)

```sql
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
```

`p_options` formatı: `[{"text": "Sinema", "image_url": null}, {"text": "Restoran", "image_url": "https://..."}]`

### 4.5 Row Level Security (ZORUNLU)

```sql
alter table public.profiles enable row level security;
alter table public.polls    enable row level security;
alter table public.options  enable row level security;
alter table public.votes    enable row level security;

-- profiles: herkes okuyabilir (kullanıcı adı gösterimi + kullanıcı adı müsaitlik kontrolü)
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
```

### 4.6 Storage (anket görselleri)

```sql
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
```

Dosya yolu formatı: `{user_id}/{uuid}.{uzantı}`

---

## 5. Veri Çekme Notları (frontend)

- **Feed:**
  ```ts
  supabase
    .from('polls')
    .select('id, question, created_at, profiles(username), options(id, text, image_url, position)')
    .order('created_at', { ascending: false })
    .range(from, from + 9)
  ```
- **Oy sayıları:** Feed'deki `poll_id`'ler için `option_vote_counts` view'undan tek sorguyla çek (`.in('poll_id', ids)`). Yüzdeyi frontend'de hesapla.
- **Kullanıcının kendi oyları:** Giriş yapmışsa `votes` tablosundan `.in('poll_id', ids)` ile çek. Oy verilmiş anketlerde sonuç barlarını göster, verilmemişlerde sadece tıklanabilir seçenekleri göster.
- **Oy verme:** `votes` tablosuna `insert`. Unique ihlali (`23505`) gelirse "Bu ankete zaten oy verdin" mesajı göster.
- **Anket oluşturma:** `supabase.rpc('create_poll', { p_question, p_options })`. Görsel varsa önce Storage'a yükle, dönen public URL'yi `image_url` olarak ver.

---

## 6. Auth Notları

- Kayıt:
  ```ts
  supabase.auth.signUp({
    email, password,
    options: { data: { username } }
  })
  ```
- Kayıt formunda kullanıcı adı müsaitliği `profiles` tablosundan kontrol edilir (`.eq('username', value)`). Yine de DB `unique` kısıtı son söz sahibidir, hata gelirse "Bu kullanıcı adı alınmış" göster.
- Şifre en az 8 karakter. E-posta doğrulama Supabase'de **açık** kalsın.
- Şifremi unuttum akışı MVP'ye dahil edilmeyebilir, ama Supabase ayarı hazır tutulsun.
- Next.js tarafında `@supabase/ssr` ile `lib/supabase/client.ts` (tarayıcı) ve `lib/supabase/server.ts` (sunucu) olarak iki küçük yardımcı dosya yaz. Oturum yenileme için `middleware.ts` ekle.

---

## 7. Önerilen Klasör Yapısı

```
src/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                 # Feed
│  ├─ create/page.tsx          # Anket oluşturma
│  ├─ login/page.tsx
│  └─ register/page.tsx
├─ components/
│  ├─ Navbar.tsx
│  ├─ PollCard.tsx             # Soru + seçenekler + sonuç barları
│  ├─ PollForm.tsx             # Anket oluşturma formu
│  └─ AuthForm.tsx
├─ lib/
│  └─ supabase/
│     ├─ client.ts
│     └─ server.ts
├─ types/
│  └─ index.ts                 # Poll, Option, Vote tipleri
└─ middleware.ts
```

Bileşenleri küçük tut. Bir bileşen 150 satırı geçiyorsa böl.

---

## 8. UI Kuralları

- Mobile-first, sade ve modern tasarım (Tailwind). Tek sütun, ortalanmış, `max-w-xl`.
- Oy yüzdesi barları: `transition-all duration-500` ile genişlik animasyonu.
- Kullanıcının oy verdiği seçenek barda vurgulanır (ör. farklı renk + `Check` ikonu).
- Yükleniyor ve hata durumları her sayfada ele alınır (basit metin/spinner yeterli).
- Metinler **Türkçe**. Kod, değişken ve dosya adları İngilizce.

---

## 9. Kod Kuralları

- TypeScript `strict` açık, `any` kullanma.
- `"use client"` sadece gerçekten gerektiği yerde (hook/event kullanan bileşenler).
- Her Supabase çağrısında `error` kontrol edilir ve kullanıcıya anlaşılır mesaj gösterilir.
- Secret yok: sadece `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` kullanılır. `.env.local` git'e eklenmez, `.env.example` oluşturulur.
- Yorumlar kısa ve Türkçe olabilir. Gereksiz yorum yazma.

---

## 10. Adım Adım Yol Haritası

Her adım bitince dur, özetle, onay bekle.

1. **Supabase kurulumu:** Bölüm 4'teki SQL'leri sırayla çalıştır. Çalıştığını kontrol etmem için basit test sorguları ver.
2. **Next.js kurulumu:** Proje oluştur (TypeScript, Tailwind, App Router), paketleri yükle, Supabase client/server dosyaları ve middleware.
3. **Auth:** Kayıt (kullanıcı adı dahil), giriş, çıkış, Navbar.
4. **Feed:** Anketleri listele (sayfalama ile), `PollCard` (henüz oy vermeden).
5. **Oy verme:** Oy kaydetme, yüzde barları, tek oy kuralı hata yönetimi.
6. **Anket oluşturma:** Form (2-5 dinamik seçenek), `create_poll` RPC, opsiyonel görsel yükleme.
7. **Anket silme:** Sahibine özel sil butonu + onay.
8. **Son rötuşlar:** Boş durum/hata mesajları, mobil kontrol, Vercel deploy ve ortam değişkenleri.

**İlk görev:** Adım 1'i başlat. Bölüm 4'teki SQL'leri gözden geçir, eksik ya da hatalı bir şey görürsen belirt, sonra bana Supabase'de nasıl çalıştıracağımı ve doğrulayacağımı anlat.
