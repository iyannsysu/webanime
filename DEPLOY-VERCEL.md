# 🚀 Deploy ke Vercel - Tutorial Lengkap

## 📋 Cara Deploy Website Anime ke Vercel

### Metode 1: Deploy via GitHub (Recommended)

#### Step 1: Upload ke GitHub

```bash
# 1. Buka terminal di folder anime-website
cd anime-website

# 2. Inisialisasi Git
git init

# 3. Tambahkan semua file
git add .

# 4. Commit
git commit -m "Initial commit - IndoAnime Website"

# 5. Buat repository baru di GitHub (https://github.com/new)
#    Nama: anime-website (atau sesuai keinginan)

# 6. Connect ke GitHub
git remote add origin https://github.com/USERNAME/anime-website.git

# 7. Push ke GitHub
git branch -M main
git push -u origin main
```

#### Step 2: Deploy di Vercel

1. Buka **[https://vercel.com](https://vercel.com)**
2. Login dengan akun GitHub
3. Klik **"Add New"** → **"Project"**
4. Pilih repository **anime-website**
5. Klik **"Deploy"**
6. Tunggu proses selesai ✅
7. Website berhasil di-deploy! 🎉

---

### Metode 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login ke Vercel

```bash
vercel login
```

#### Step 3: Deploy

```bash
# Buka terminal di folder anime-website
cd anime-website

# Deploy
vercel

# Ikuti pertanyaan:
# ? Set up and deploy? → Y
# ? Which scope? → Pilih akun kamu
# ? Link to existing project? → N
# ? What's your project's name? → anime-website
# ? In which directory is your code located? → ./
# ? Want to override the settings? → N
```

#### Step 4: Deploy ke Production

```bash
vercel --prod
```

---

### Metode 3: Deploy via Vercel Dashboard (Drag & Drop)

1. Buka **[https://vercel.com](https://vercel.com)**
2. Login
3. Klik **"Add New"** → **"Project"**
4. Scroll ke bawah, klik **"Import Third-Party Git Repository"** atau drag & drop folder
5. Atau buka **https://vercel.com/new** lalu drag & drop folder `anime-website`
6. Tunggu proses selesai ✅

---

## 📁 Struktur File untuk Vercel

```
anime-website/
├── index.html        ← File utama
├── style.css         ← Styling
├── app.js            ← JavaScript
├── vercel.json       ← Konfigurasi Vercel
├── README.md         ← Dokumentasi
└── DEPLOY-VERCEL.md  ← File ini
```

## ⚙️ Konfigurasi Vercel

File `vercel.json` sudah dikonfigurasi dengan:
- ✅ Static hosting
- ✅ CORS headers (untuk akses API)
- ✅ Routing yang benar

## 🌐 Setelah Deploy

Setelah berhasil deploy, kamu akan mendapat URL seperti:
- `https://anime-website.vercel.app`
- `https://anime-website-username.vercel.app`

## 🔧 Custom Domain (Opsional)

1. Buka Dashboard Vercel
2. Pilih project **anime-website**
3. Klik **Settings** → **Domains**
4. Masukkan domain kamu
5. Ikuti instruksi DNS

## ❓ Troubleshooting

### Masalah: API tidak bisa diakses
**Solusi:** Pastikan `vercel.json` sudah ada dengan CORS headers

### Masalah: Halaman blank
**Solusi:** Cek console browser (F12) untuk error

### Masalah: Deploy gagal
**Solusi:** 
```bash
# Pastikan semua file sudah di-commit
git status
git add .
git commit -m "Fix files"
git push
```

## 📱 Test Setelah Deploy

1. Buka URL Vercel kamu
2. Cek semua menu berfungsi
3. Test pencarian anime
4. Test streaming video

---

## 🎉 Selesai!

Website anime kamu sekarang sudah online di Vercel!

**Tips:** Setiap kali kamu push ke GitHub, Vercel akan otomatis redeploy website.

---

**Catatan:** Vercel gratis untuk hobby project. Batasannya:
- 100GB bandwidth/bulan
- 100 deployments/hari
- Serverless function timeout 10 detik

Untuk website anime ini, paket gratis sudah lebih dari cukup! 🚀
