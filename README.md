# 💭 Etiraf Platforması - TAM VERSİYA

Real-time etiraf platforması. Canlı yayım, PK, hədiyyələr, səs/video kontrolları və tam funksional admin paneli!

## ✨ Əsas Xüsusiyyətlər

### 📝 **Etiraf Sistemi**
- ✅ **Anonim/Açıq seçimi** - Checkbox ilə etirafınızı anonim və ya adınızla paylaşın
- ✅ Real-time yeniləmələr (Socket.IO)
- ✅ Bəyənmə sistemi (canlı yenilənir)
- ✅ Şərh sistemi (real-time)
- ✅ 5 kateqoriya: Sevgi, Dostluq, İş, Ailə, Digər
- ✅ Online istifadəçi sayı

### 📹 **Canlı Yayım** (TAM FUNKSIONAL)
- ✅ **Video/Audio stream** - Kamera və mikrofon
- ✅ **Səs bağlama** 🔊/🔇 düyməsi
- ✅ **Video bağlama** 📹/📷 düyməsi
- ✅ Real-time chat
- ✅ İzləyici sayğacı
- ✅ **Konuk əlavə etmə** (multi-host)
- ✅ 50 jeton qiymət

### 🎁 **Hədiyyə Sistemi** (12 HƏDIYYƏ)
| Hədiyyə | Qiymət |
|---------|--------|
| 🌹 Gül | 1 jeton |
| ❤️ Ürək | 5 jeton |
| 🌟 Ulduz | 10 jeton |
| 🎂 Tort | 20 jeton |
| 🐰 Dovşan | 50 jeton |
| 👑 Tac | 100 jeton |
| 🛡️ Qalxan | 200 jeton |
| 🚗 Maşın | 500 jeton |
| 🦁 Aslan | 1000 jeton |
| ✈️ Uçaq | 2000 jeton |
| 🛥️ Yaxta | 5000 jeton |
| 🐋 Balina | 10000 jeton |

**Xüsusiyyətlər:**
- ✅ **3D Animasiyalar** - Hədiyyələr ekranda uçur və görünür
- ✅ Real-time görünmə
- ✅ Emoji + Ad + Qiymət göstərilməsi
- ✅ PK zamanı tərəf seçimi

### ⚔️ **PK (Jeton Savaşı)**
- ✅ İki yayım arasında rəqabət
- ✅ **Real-time jeton sayğacı** (VS paneli)
- ✅ Hədiyyələr avtomatik tərəfə sayılır
- ✅ Qələbəçi avtomatik təyin edilir
- ✅ Müddət sistemi (default 5 dəqiqə)

### 📞 **Dəstək Mərkəzi**
- ✅ 5 mövzu: Texniki, Şikayət, Təklif, Hesab, Digər
- ✅ Status sistemi: Açıq → Baxılır → Həll olundu → Bağlandı
- ✅ Admin cavabları
- ✅ Müraciət tarixçəsi
- ✅ Prioritet sistemi

### 🔐 **İstifadəçi Sistemi**
- ✅ **Sadə qeydiyyat**: Yalnız istifadəçi adı + şifrə
- ✅ **İlk Admin**: reyllas / reylasbaba2019z
- ✅ Rol sistemi: Admin, Moderator, İstifadəçi
- ✅ **Jeton iqtisadiyyatı** (100 başlanğıc jeton)
- ✅ Profil və statistika

### 🛠️ **Admin Paneli**
- ✅ İstifadəçi idarəsi (siyahı, axtarış)
- ✅ **Jeton verilməsi** (istənilən miqdar, istənilən istifadəçiyə)
- ✅ Rol dəyişikliği (admin/moderator/istifadəçi)
- ✅ İstifadəçi aktiv/deaktiv etmə
- ✅ Ümumi statistika
- ✅ Jeton tarixçəsi

### 📱 **PWA (Progressive Web App)**
- ✅ Telefona yüklənə bilər (iOS, Android, Desktop)
- ✅ Offline rejim dəstəyi
- ✅ Service Worker
- ✅ manifest.json
- ✅ App kimi işləyir

## 🛠️ Texnologiyalar

### Backend
- **Node.js** & Express.js
- **Socket.IO** - Real-time
- **MongoDB** (Mongoose)
- **JWT** - Autentifikasiya
- **bcryptjs** - Şifrə hash
- **WebRTC** signaling

### Frontend
- **React 18**
- **Vite**
- **Socket.IO Client**
- **Axios**
- **Context API**
- **PWA** (Service Worker, Manifest)

## 📦 Quraşdırma

### Tələblər
- Node.js (v16+)
- MongoDB

### Addım-addım

```bash
# 1. Layihə qovluğuna keçin
cd etiraf

# 2. Asılılıqları yükləyin
npm install
cd client
npm install
cd ..

# 3. MongoDB işə salın
mongod

# 4. Hər iki serveri işə salın
npm run dev
```

## 🚀 İstifadə

### İlk Giriş

1. **Frontend**: http://localhost:5173
2. **Backend**: http://localhost:5000/api/health

### Admin Hesabı

Server ilk dəfə işə düşəndə avtomatik admin yaradılır:

```
İstifadəçi adı: reyllas
Şifrə: reylasbaba2019z
```

### Əsas Əməliyyatlar

1. **Qeydiyyat** - Yeni istifadəçi yarat (100 pulsuz jeton)
2. **Etiraf yaz** - Anonim və ya adınla paylaş
3. **Canlı yayım** - 50 jetona video yayım başlat
4. **Hədiyyə göndər** - 1-10000 jeton arası hədiyyələr
5. **PK başlat** - Başqa yayımla rəqabət et

## 📡 API Endpoints

### Autentifikasiya
```
POST /api/auth/qeydiyyat  - Qeydiyyat (ad + şifrə)
POST /api/auth/giris      - Giriş
GET  /api/auth/profil     - Profil məlumatları
PUT  /api/auth/profil     - Profil yenilə
GET  /api/auth/yoxla      - Token yoxla
```

### Etiraflar
```
GET  /api/etiraf          - Bütün etiraflar
POST /api/etiraf          - Yeni etiraf (anonim seçimi ilə)
POST /api/etiraf/:id/beyenme  - Bəyən
POST /api/etiraf/:id/serh     - Şərh əlavə et
```

### Canlı Yayım
```
GET  /api/canli-yayim               - Bütün yayımlar
POST /api/canli-yayim               - Yayım başlat (50 jeton)
PUT  /api/canli-yayim/:id/bitir     - Yayımı bitir
POST /api/canli-yayim/:id/chat      - Chat mesajı
POST /api/canli-yayim/:id/hediyye   - Hədiyyə göndər
POST /api/canli-yayim/:id/konuk-cagiris - Konuk çağır
POST /api/canli-yayim/:id/pk-baslat - PK başlat
PUT  /api/canli-yayim/:id/pk-bitir  - PK bitir
```

### Dəstək
```
POST /api/destek        - Müraciət göndər
GET  /api/destek/menim  - Mənim müraciətlərim
GET  /api/destek/:id    - Tək müraciət
```

### Admin
```
GET  /api/admin/statistika           - Ümumi statistika
GET  /api/admin/istifadeciler        - İstifadəçi siyahısı
POST /api/admin/jeton-ver/:userId    - Jeton ver
PUT  /api/admin/rol-deyis/:userId    - Rol dəyişdir
PUT  /api/admin/istifadeci-status/:userId - Aktiv/deaktiv
DELETE /api/admin/etiraf/:id         - Etirafı sil
```

## 🔌 Socket.IO Events

### Server → Client
```javascript
'yeni-etiraf'         - Yeni etiraf yaradıldı
'beyenme-yenilendi'   - Bəyənilmə sayı dəyişdi
'yeni-serh'           - Yeni şərh əlavə olundu
'istifadeci-sayi'     - Online istifadəçi sayı
'yeni-canli-yayim'    - Yeni canlı yayım
'canli-yayim-bitdi'   - Yayım bitdi
'yeni-chat-mesaj'     - Chat mesajı
'izleyici-sayisi'     - İzləyici sayı
'yeni-hediyye'        - Hədiyyə göndərildi (animasiya)
'pk-basladi'          - PK başladı
'pk-bitdi'            - PK bitdi
'konuk-media-deyisdi' - Konuk səs/video dəyişdi
```

### Client → Server
```javascript
'user-qosul'             - İstifadəçi qoşuldu
'canli-yayima-qosul'     - Yayıma qoşul
'canli-yayimdan-ayril'   - Yayımdan ayrıl
'konuk-media-status'     - Media statusunu dəyişdir
```

## 📁 Layihə Strukturu

```
etiraf/
├── server/
│   ├── models/
│   │   ├── User.js           - İstifadəçi (rol, jeton)
│   │   ├── Etiraf.js         - Etiraf (anonim)
│   │   ├── CanliYayim.js     - Canlı yayım (PK, konuk, hədiyyə)
│   │   ├── Destek.js         - Dəstək müraciətləri
│   │   └── Hediyye.js        - Hədiyyə konfiqurasiyası
│   ├── routes/
│   │   ├── auth.js           - Autentifikasiya
│   │   ├── etiraf.js         - Etiraflar
│   │   ├── canliYayim.js     - Canlı yayım
│   │   ├── admin.js          - Admin əməliyyatları
│   │   └── destek.js         - Dəstək
│   ├── middleware/
│   │   └── auth.js           - JWT middleware
│   ├── socket/
│   │   └── handlers.js       - Socket.IO
│   ├── utils/
│   │   └── createAdmin.js    - Admin yaratma
│   └── index.js
├── client/
│   ├── public/
│   │   ├── manifest.json     - PWA manifest
│   │   └── sw.js             - Service Worker
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── EtirafForm.jsx
│   │   │   ├── EtirafCard.jsx
│   │   │   ├── CanliYayim.jsx   - Tam funksional
│   │   │   ├── AdminPanel.jsx
│   │   │   └── Destek.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── hediyyeler.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── index.html
├── .env
├── package.json
└── README.md
```

## 🎯 Real-time Funksiyalar

✅ **Etiraflar** - Yeni etiraf dərhal hamıda görünür  
✅ **Bəyənmələr** - Canlı yenilənir  
✅ **Şərhlər** - Real-time əlavə olur  
✅ **Hədiyyələr** - 3D animasiya ilə ekranda uçur  
✅ **PK jetonları** - Canlı say olunur  
✅ **Chat** - Dərhal çatdırılır  
✅ **İzləyicilər** - Real-time sayğac  

## 🎁 Hədiyyə Animasiyaları

Hədiyyələr göndərildikdə:
- 3D float animasiyası
- Emoji + göndərən adı + hədiyyə adı
- Qiyməti görə ölçü (1 jeton kiçik, 10000 jeton böyük)
- 3 saniyə ekranda qalır
- PK zamanı tərəf rəngləri

## 🔒 Təhlükəsizlik

- JWT token autentifikasiyası
- bcrypt şifrə hash
- Rol əsaslı icazələr (RBAC)
- CORS konfiqurasiyası
- Input validasiyası
- MongoDB injection qorunması

## 📱 PWA Yükləmə

### Chrome (Desktop)
1. Saytı açın
2. URL yanındakı ⊕ düyməsinə klikləyin
3. "Quraşdır"

### Chrome (Android)
Menu → "Ana ekrana əlavə et"

### Safari (iOS)
Paylaş → "Ana ekrana əlavə et"

## 🆘 Problemlər

**MongoDB bağlanmır:**
- MongoDB servisi işləyirsə yoxlayın: `mongod --version`
- Connection string-i yoxlayın

**Socket.IO işləmir:**
- CORS konfiqurasiyası düzdür
- Port 5000 və 5173 açıqdır

**Kamera işləmir:**
- Brauzerdə kamera icazəsi verin
- HTTPS lazım ola bilər (production)

## 💡 İstifadə Ssenarisı

1. **İstifadəçi qeydiyyatdan keçir** → 100 jeton alır
2. **Etiraf yazır** → Anonim və ya adı ilə
3. **Başqalarının etiraflarını bəyənir** → Real-time
4. **Canlı yayım başladır** → 50 jeton xərcləyir
5. **İzləyicilər hədiyyə göndərir** → 3D animasiya
6. **Başqa yayımla PK atır** → Jeton savaşı
7. **Problem olursa** → Dəstək mərkəzinə yazır
8. **Admin cavab verir** → Problem həll olunur

## 🎉 Xüsusiyyətlər

- 🚀 Tam real-time
- 🎨 Modern UI/UX
- 📱 Mobil responsiv
- 🔐 Təhlükəsiz
- ⚡ Sürətli
- 💰 Jeton iqtisadiyyatı
- 🎁 Hədiyyə sistemi
- ⚔️ PK sistemi
- 👥 Multi-host
- 🎤 Səs/video kontrolları

## 📝 Lisenziya

MIT

## 👨‍💻 Müəllif

**Admin:** reyllas  
Kiro AI ilə hazırlanıb ❤️

---

**Bütün funksiyalar REAL işləyir! 🎊**
