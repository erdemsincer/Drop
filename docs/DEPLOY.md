# Canlıya çıkış rehberi (Railway + Resend)

API'yi, PostGIS'li veritabanını ve e-posta gönderimini ayağa kaldırmak için
gereken adımlar. Toplam ~30 dakika sürer.

## 1. Railway projesi

1. https://railway.com adresinde GitHub hesabınla giriş yap.
2. **New Project → Deploy from GitHub repo →** bu repoyu seç.
   Railway kök dizindeki `railway.toml` sayesinde `Dockerfile` ile derler.
3. Aynı projede **+ New → Template → "PostGIS"** ekle.
   Düz "PostgreSQL" şablonu yetmez; konum sorguları PostGIS eklentisini ister.

## 2. API ortam değişkenleri

API servisinde **Variables** sekmesine şunları ekle:

| Değişken | Değer |
| --- | --- |
| `DATABASE_URL` | `${{PostGIS.DATABASE_URL}}` (Railway referansı, veritabanı servisinin adıyla) |
| `Database__MigrateOnStartup` | `true` |
| `Jwt__Key` | `openssl rand -base64 48` çıktısı |
| `Qr__SigningKey` | ayrı bir `openssl rand -base64 48` çıktısı |
| `ReverseProxy__Enabled` | `true` |
| `Admin__Emails` | işletme onaylayacak e-postalar, virgülle |
| `Email__ResendApiKey` | Resend API anahtarı (aşağıda) |
| `Email__From` | `Drop <no-reply@alan-adin.com>` |

`PORT` ve `DATABASE_URL`'i API kendisi tanır; ayrıca `ConnectionStrings__Database`
yazmana gerek yok. Eksik ya da zayıf anahtarla API bilerek açılmaz (log'da nedenini yazar).

## 3. Resend (e-posta)

1. https://resend.com hesabı aç → **API Keys → Create** → anahtarı
   `Email__ResendApiKey` olarak Railway'e yapıştır. SMTP değil HTTPS API kullanılır:
   Railway deneme/Hobby planlarında giden SMTP portlarını engeller.
2. **Domains → Add Domain** ile kendi alan adını ekleyip DNS kayıtlarını gir.
   Doğrulanana kadar yalnızca `onboarding@resend.dev` adresinden ve sadece
   kendi e-postana gönderebilirsin; test için `Email__From` = `Drop <onboarding@resend.dev>` kullan.

Doğrulama ve şifre sıfırlama kodları bu yolla gider. SMTP yoksa canlıda kod gitmez
ve hiçbir işletme onaylanamaz (sahibinin e-postası doğrulanamaz).

## 4. Yayına al ve kontrol et

1. **Settings → Networking → Generate Domain** ile genel adres al
   (ör. `drop-api-production.up.railway.app`).
2. `https://<adres>/health/ready` → `{"status":"Healthy"...}` dönmeli.
3. Mobil build'de `EXPO_PUBLIC_API_URL` olarak bu adresi kullan
   (`mobile/Drop.Mobile/eas.json` içindeki `preview` ve `production` profilleri).

## 5. Mobil build (EAS)

Bir kez, `mobile/Drop.Mobile` klasöründe:

```bash
npx eas-cli@latest login     # Expo hesabı (ücretsiz)
npx eas-cli@latest init      # projeyi Expo'ya bağlar, app.json'a projectId ekler
```

`eas.json` içindeki `REPLACE-WITH-RAILWAY-DOMAIN` kısımlarını 4. adımdaki adresle değiştir.
Kimlik: `app.json` → `ios.bundleIdentifier` / `android.package` = `app.drop.mobile`
(mağazaya çıkmadan önce istersen değiştir; sonra değiştirilemez).

- **Android test (APK, hesap gerekmez):** `npx eas-cli@latest build -p android --profile preview`
  → bitince verilen linkten telefona kur.
- **iOS test (TestFlight, Apple Developer hesabı gerekir, yıllık $99):**
  `npx eas-cli@latest build -p ios --profile production` ardından
  `npx eas-cli@latest submit -p ios`.

Push bildirimleri (takip edilen işletme yeni Drop yayınlayınca) `eas init` ile
proje kimliği eklendikten sonra çalışır; API, Expo'nun push servisine ek bir anahtar
olmadan gönderir. Expo projesinde "enhanced push security" açarsan Railway'e
`Push__ExpoAccessToken` ekle.

## Sonra

- Hata takibi: https://sentry.io'da iki proje aç (ASP.NET Core ve React Native).
  API için Railway'e `Sentry__Dsn` ekle; mobil için `eas.json`'daki profillerin `env`
  bölümüne `EXPO_PUBLIC_SENTRY_DSN` ekleyip DSN'i yaz (boş değer kabul edilmez). Boş bırakılırsa raporlama kapalıdır; Expo Go'da hiç yüklenmez.
- Yedek: Railway PostGIS servisinde **Backups**'ı aç.
