# ThisOrThat (ToT)

Kararsız kalan kullanıcıların bir soru ve 2-5 seçenek paylaşıp diğer kullanıcılardan oy topladığı **hızlı ve modern bir MVP sosyal anket uygulaması**.

---

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Stil & Tasarım:** Tailwind CSS v4 + `lucide-react`
- **Backend & Veritabanı:** Supabase (PostgreSQL)
- **Kimlik Doğrulama:** Supabase Auth (E-posta + Şifre + Benzersiz Kullanıcı Adı)
- **Dosya Depolama:** Supabase Storage (`poll-images` bucket)
- **Paketler:** `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`
- **Deploy:** Vercel

---

## 🛠️ Yerel Geliştirme Kurulumu

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/osmankalkan/ToT.git
cd ToT
npm install
```

### 2. Veritabanı Kurulumu (Supabase)
1. [supabase.com](https://supabase.com) üzerinde bir proje oluşturun.
2. Supabase Dashboard > **SQL Editor** menüsüne gidin.
3. `supabase/schema.sql` dosyasının içeriğini yapıştırıp çalıştırın (`Run`).
4. (Opsiyonel) Kurulumun doğruluğunu test etmek için `supabase/tests.sql` dosyasını çalıştırın (Sonuç: `Tüm testler geçti ✅`).

### 3. Ortam Değişkenleri (.env.local)
`.env.example` dosyasını `.env.local` olarak kopyalayın:
```bash
cp .env.example .env.local
```
Supabase Dashboard > **Project Settings > API** bölümünden URL ve Anon Key değerlerini ekleyin:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine gidin.

---

## 🌐 Vercel Üzerinde Yayınlama (Deploy)

1. [vercel.com](https://vercel.com) üzerinde **Add New > Project** seçeneğine tıklayın.
2. GitHub reponuzu (`osmankalkan/ToT`) seçin.
3. **Environment Variables** bölümüne şu iki değişkeni ekleyin:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy** butonuna tıklayın.

> **Supabase Auth URL Ayarı:** Vercel deployment tamamlandıktan sonra Vercel domaininizi (örn. `https://tot-app.vercel.app`) Supabase Dashboard > **Authentication > URL Configuration > Site URL** ve **Redirect URLs** alanlarına ekleyin.

---

## 📋 Özellikler

- ✅ **Kayıt & Giriş:** Canlı kullanıcı adı müsaitlik kontrolü (`profiles` tablosu), en az 8 karakter şifre.
- ✅ **Feed & Sayfalama:** En yeni anketler 10'ar adet listelenir, "Daha Fazla Yükle" butonu.
- ✅ **Anket Açma:** 3-200 karakter soru, dinamik 2-5 seçenek, opsiyonel görsel yükleme (max 2MB), `create_poll` atomik RPC.
- ✅ **Oy Verme:** Tek tıkla oy verme, anlık `transition-all duration-500` animasyonlu yüzde barları, oy verilen seçenekte `Check` rozeti.
- ✅ **Tek Oy Kuralı:** Bir kullanıcı bir ankete yalnızca 1 kez oy verebilir (PostgreSQL `unique` kısıtı korumalı).
- ✅ **Anket Silme:** Sadece anketin sahibi kendi anketini satır içi onay korumasıyla silebilir (cascade ile oylar ve seçenekler otomatik temizlenir).
- ✅ **Mobile-First & Sade UI:** `max-w-xl` tek sütun, duyarlı Navbar ve boş/hata durumu yönetimi.
