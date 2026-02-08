# CRUD Geliştirme TODO

## Görev 1: Optimistic UI Güncellemesini Düzelt (App.tsx) ✅

- [x] deleteStudent fonksiyonunda hata durumunda UI'ı geri çevir
- [x] deleteHomework fonksiyonunda hata durumunda UI'ı geri çevir
- [x] Toast/alert ile kullanıcıyı bilgilendir

## Görev 2: REST Endpoint'leri Ekle (server.js) ✅

- [x] DELETE /api/homework/:id endpoint'i ekle
- [x] DELETE /api/submission/:id endpoint'i ekle

## Görev 3: Transaction Güvenliğini Artır (server.js) ✅

- [x] Submission işlemlerini upsert ile yap (delete + createMany yerine)

## Görev 4: Service Katmanlarını Temizle

- [ ] Kullanılmayan service dosyalarını kaldır (opsiyonel - mevcut kod çalışıyor)
