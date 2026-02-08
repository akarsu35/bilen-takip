Adımlar — Supabase + Prisma kurulum

1. Supabase projesi oluştur

- https://app.supabase.com adresine gidin ve yeni bir proje oluşturun.
- Proje oluşturulduktan sonra `Settings -> Database -> Connection string` kısmından Postgres bağlantı dizesini alın.

2. `.env` dosyası oluşturun

- Proje kökünde `.env` dosyası oluşturun ve `DATABASE_URL`'ı Supabase bağlantı dizesiyle değiştirin.
- Örnek: `.env.example` dosyasını inceleyin.

3. Bağımlılıkları kurun (eğer kurulu değilse)

```bash
npm install
# veya
yarn
```

4. Prisma client oluşturun

```bash
npx prisma generate
```

5. Migrations (opsiyonel)

- Eğer veri modellerinde değişiklik yaptıysanız migration oluşturun ve çalıştırın:

```bash
npx prisma migrate dev --name init
```

Not: Supabase üzerinde migration çalıştırırken dikkatli olun; production veritabanlarında doğrudan migrate çalıştırmadan önce yedek alın.

6. Sunucuyu çalıştırma

- Uygulamanızın sunucu kısmı `server/server.js` ise, node ile çalıştırın veya projenize göre `npm run dev` kullanın.

7. Test

- `services/db.ts` ve `services/studentService.ts` zaten Prisma client kullanıyor. `.env` doğru ayarlanırsa doğrudan veritabanı işlemleri çalışacaktır.

Yardım isterseniz, sizin için `.env` dosyasını yerleştirmede veya migration komutlarını çalıştırmada yardımcı olabilirim.
