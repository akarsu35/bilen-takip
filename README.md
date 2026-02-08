<div align="center">

# 📚 Ödev Takip & Veli Bilgilendirme Sistemi

<p align="center">
  <strong>Öğretmenler için akıllı ödev takip ve otomatik veli bilgilendirme platformu</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/Supabase-Auth-green?style=for-the-badge&logo=supabase" alt="Supabase">
</p>

</div>

---

## ✨ Özellikler

### 📋 Ödev Yönetimi

- **Ödev Oluşturma**: Sınıf veya öğrenci bazlı ödev atama
- **Durum Takibi**: Ödevlerin tamamlanma durumunu izleme (Yapıldı, Eksik, Yapılmadı, Gelmedi)
- **Toplu İşlemler**: Birden fazla öğrenciyi aynı anda işaretleme

### 👨‍🎓 Öğrenci Yönetimi

- **Öğrenci Ekleme**: Tek tek veya Excel ile toplu öğrenci ekleme
- **Sınıf Bazlı Organizasyon**: Öğrencileri sınıflara göre gruplama
- **Devamsızlık Takibi**: Katılım ve devamsızlık sayılarını görüntüleme
- **Geçmiş Görüntüleme**: Her öğrencinin ödev geçmişini detaylı inceleme

### 📱 Otomatik Veli Bilgilendirme

- **WhatsApp Entegrasyonu**: Tek tıkla veli mesajı gönderme
- **Kişiselleştirilmiş Mesajlar**: Öğretmen profil bilgileriyle zenginleştirilmiş mesajlar
- **Tekrar Bildirim**: Daha önce bildirilmiş ödevler için hatırlatma mesajı
- **Devamsızlık Bildirimi**: Derse katılmayan öğrenciler için otomatik mesaj

### 🔐 Kimlik Doğrulama

- **Google OAuth**: Google hesabıyla kolay giriş
- **E-posta/Şifre**: Geleneksel e-posta ile kayıt ve giriş
- **Güvenli Oturum**: Supabase Auth ile güvenli oturum yönetimi

### 👤 Profil Yönetimi

- **Öğretmen Profili**: İsim, okul adı ve branş bilgisi ekleme
- **Kişiselleştirme**: Veli mesajlarında profil bilgilerinin kullanılması

---

## 🛠️ Teknolojiler

| Teknoloji            | Açıklama                                |
| -------------------- | --------------------------------------- |
| **Next.js 15**       | React tabanlı full-stack framework      |
| **React 19**         | Modern UI kütüphanesi                   |
| **TypeScript**       | Tip güvenli JavaScript                  |
| **Tailwind CSS**     | Utility-first CSS framework             |
| **Prisma**           | Modern ORM                              |
| **Supabase**         | PostgreSQL veritabanı ve Authentication |
| **Google Gemini AI** | Akıllı mesaj önerileri (opsiyonel)      |

---

## 🚀 Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Supabase hesabı

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/akarsu35/odev-takip-veli-bilgilendirme.git
cd odev-takip-veli-bilgilendirme
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın

`.env` dosyasını oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url

# Gemini AI (Opsiyonel)
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Veritabanını Hazırlayın

```bash
npx prisma db push
```

### 5. Uygulamayı Başlatın

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

---

## 📖 Kullanım

### İlk Kullanım

1. Google hesabınızla veya e-posta ile giriş yapın
2. Profil bilgilerinizi (isim, okul, branş) doldurun
3. Öğrencilerinizi ekleyin (tek tek veya Excel ile)
4. Ödev oluşturun ve sınıfları/öğrencileri seçin

### Ödev Kontrolü

1. Ana sayfadan kontrol edeceğiniz ödevi seçin
2. Her öğrenci için durumu işaretleyin (✓ Yapıldı, ○ Eksik, ✕ Yapılmadı, - Gelmedi)
3. Eksik veya yapılmamış ödevler için "Bildir" butonuna tıklayın
4. WhatsApp otomatik olarak açılır ve mesaj hazır olur

### Excel ile Öğrenci Ekleme

Excel dosyanız şu sütunları içermelidir:

- **A Sütunu**: Öğrenci Adı
- **B Sütunu**: Veli Adı
- **C Sütunu**: Telefon Numarası
- **D Sütunu**: Sınıf

---

## 📁 Proje Yapısı

```
├── app/
│   ├── api/              # API routes
│   ├── auth/             # Auth callback
│   ├── components/       # React components
│   │   ├── CheckPanel.tsx       # Ödev kontrol paneli
│   │   ├── HomeworkManager.tsx  # Ödev yönetimi
│   │   ├── StudentManager.tsx   # Öğrenci yönetimi
│   │   ├── StudentHistory.tsx   # Öğrenci geçmişi
│   │   └── ProfileSettings.tsx  # Profil ayarları
│   ├── login/            # Giriş sayfası
│   └── page.tsx          # Ana sayfa
├── prisma/
│   └── schema.prisma     # Veritabanı şeması
├── services/
│   ├── db.ts             # Veritabanı işlemleri
│   └── geminiService.ts  # AI mesaj servisi
└── utils/
    └── supabase/         # Supabase client yapılandırması
```

---

## 🔧 Ek Dokümantasyon

- [Google Auth Kurulumu](./GOOGLE_AUTH_SETUP.md)
- [Supabase Kurulumu](./SUPABASE_SETUP.md)

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

<div align="center">
  <p>
    <strong>🎓 Öğretmenler için, öğretmenler tarafından geliştirildi</strong>
  </p>
  <p>
    <a href="https://github.com/akarsu35/odev-takip-veli-bilgilendirme/issues">Sorun Bildir</a>
    •
    <a href="https://github.com/akarsu35/odev-takip-veli-bilgilendirme/pulls">Katkıda Bulun</a>
  </p>
</div>
