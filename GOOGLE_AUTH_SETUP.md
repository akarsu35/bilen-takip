# Google ile Giriş (OAuth) Kurulumu

Google ile giriş özelliğinin çalışması için Supabase ve Google Cloud üzerinde bazı ayarlar yapılması gerekmektedir.

## 1. Google Cloud Projesi Oluşturma

1.  [Google Cloud Console](https://console.cloud.google.com/) adresine gidin.
2.  Sol üstteki proje seçiciden **"New Project"** (Yeni Proje) butonuna tıklayın.
3.  Proje ismi verin (örn: `OdevTakip`) ve **Create** diyerek oluşturun.

## 2. OAuth İzni Ekranı (Consent Screen) Ayarları

1.  Soldaki menüden **APIs & Services > OAuth consent screen** seçeneğine gidin.
2.  **User Type** olarak **External** seçin ve **Create** butonuna basın.
3.  **App Information** kısmında:
    - **App name**: Uygulamanızın adı.
    - **User support email**: Kendi mail adresiniz.
    - **Developer contact information**: Kendi mail adresiniz.
    - Diğer alanları boş bırakıp **Save and Continue** diyebilirsiniz.

## 3. Erişim Bilgileri (Credentials) Oluşturma

1.  Soldaki menüden **Credentials** sekmesine gidin.
2.  Üstteki **+ CREATE CREDENTIALS** butonuna basıp **OAuth client ID** seçin.
3.  **Application type** olarak **Web application** seçin.
4.  **Name** kısmında bir isim verin.
5.  **DİKKAT:** İki farklı alan vardır:
    - **Authorized JavaScript origins**: **BU ALANI BOŞ BIRAKIN** (veya sadece `https://<PROJECT-ID>.supabase.co` yazın, ASLA `/auth/v1/callback` uzantısını buraya eklemeyin).
    - **Authorized redirect URIs**: **İŞTE BURASI DOĞRU YER!** Buradaki **+ ADD URI** butonuna tıklayıp şu adresi ekleyin:
      - `https://<KENDI-SUPABASE-ID-NIZ>.supabase.co/auth/v1/callback`
      - _(Bu adresi Supabase panelinde Settings > API kısmından URL'nizi öğrenerek tamamlayabilirsiniz veya Auth Provider ayarlarında görebilirsiniz.)_
6.  **Create** butonuna basın.
7.  Açılan ekranda size verilen **Client ID** ve **Client Secret** değerlerini kopyalayın.

## 4. Supabase Ayarları

1.  [Supabase Dashboard](https://app.supabase.com/) adresinden projenize girin.
2.  Soldaki menüden **Authentication > Providers** kısmına gidin.
3.  **Google** seçeneğine tıklayın.
4.  **Google enabled** anahtarını açın.
5.  **Client ID** kısmına Google Cloud'dan aldığınız ID'yi yapıştırın.
6.  **Client Secret** kısmına Google Cloud'dan aldığınız Secret'ı yapıştırın.
7.  **Save** diyerek kaydedin.

🎉 **Tebrikler!** Artık giriş sayfasındaki "Google ile Devam Et" butonu çalışacaktır.
