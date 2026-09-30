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
| `Email__SmtpHost` | `smtp.resend.com` |
| `Email__SmtpPort` | `587` |
| `Email__SmtpUser` | `resend` |
| `Email__SmtpPassword` | Resend API anahtarı (aşağıda) |
| `Email__From` | `Drop <no-reply@alan-adin.com>` |

`PORT` ve `DATABASE_URL`'i API kendisi tanır; ayrıca `ConnectionStrings__Database`
yazmana gerek yok. Eksik ya da zayıf anahtarla API bilerek açılmaz (log'da nedenini yazar).

## 3. Resend (e-posta)

1. https://resend.com hesabı aç → **API Keys → Create** → anahtarı
   `Email__SmtpPassword` olarak Railway'e yapıştır.
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

## Sonra

- Hata takibi: `Sentry__Dsn` değişkenini ekle (bkz. README).
- Yedek: Railway PostGIS servisinde **Backups**'ı aç.
