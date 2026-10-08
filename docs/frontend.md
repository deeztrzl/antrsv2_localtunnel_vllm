# Dokumentasi Frontend VeriMedRS

Sistem Frontend VeriMedRS adalah aplikasi satu halaman (Single Page Application - SPA) yang dirancang untuk membantu verifikator medis memproses data institusi Rumah Sakit, mengunggah dan meng-ingest dokumen tarif referensi, serta melakukan verifikasi kepatuhan tagihan klaim menggunakan visualisasi bertenaga AI secara real-time.

---

## 🛠️ Tech Stack

Aplikasi ini dibangun menggunakan teknologi modern:
- **Framework**: React 19 + TypeScript
- **Bundler / Build Tool**: Vite 6
- **CSS Framework**: TailwindCSS v4 (Styling modern dan responsif)
- **Icons**: Lucide React
- **HTTP Client**: Native Fetch API (Terstruktur untuk request ke backend)

---

## 🚀 Cara Menjalankan

### Prasyarat
- **Node.js** (v24.18.1 atau versi stabil terbaru)
- **npm** (v12.0.2 atau versi terbaru)

### Langkah-langkah Menjalankan Frontend
1. Masuk ke direktori `frontend`:
   ```bash
   cd frontend
   ```
2. Dikarenakan project dijalankan di server offline, folder `node_modules` telah disiapkan dan disalin secara lokal dari cache terverifikasi. Tidak perlu menjalankan `npm install`. Jika diperlukan pada environment lain, jalankan:
   ```bash
   npm install
   ```
3. Buat file `.env` di dalam folder `frontend` (file default sudah dibuat dengan `VITE_API_BASE_URL=http://localhost:8000`).
4. Jalankan server pengembangan (Dev Server):
   ```bash
   npm run dev
   ```
5. Server frontend akan berjalan di alamat default: `http://localhost:5173`. Buka alamat tersebut di browser untuk mengakses aplikasi.

---

## 🔌 Konfigurasi Environment Variable

Base URL API Backend dapat dikonfigurasi melalui file `.env` di dalam direktori `frontend`:
```env
VITE_API_BASE_URL=http://localhost:8000
```
*Catatan*: Pastikan backend API sudah menyala terlebih dahulu agar frontend dapat berkomunikasi secara lancar.

---

## 📂 Struktur Halaman & Fitur Aplikasi

Aplikasi dirancang sebagai SPA dengan navigasi sidebar yang terbagi ke dalam 5 bagian utama:

1. **Dashboard Overview**:
   - Menampilkan visualisasi ringkasan singkat statistik sistem (jumlah RS terdaftar, total dokumen tarif ter-ingest, total klaim teranalisis).
   - Tautan aksi cepat (quick actions) untuk navigasi kilat ke menu-menu utama.
   - Tabel **Job Terkini** yang menampilkan status dari 5 pekerjaan paling baru yang dikirimkan ke sistem.

2. **Manajemen Rumah Sakit**:
   - **Form Tambah RS**: Input Kode RS (unik), Nama RS, dan Alamat lengkap RS.
   - **Tabel Daftar RS**: Memuat data rumah sakit secara dinamis menggunakan endpoint `GET /rumah-sakit`.
   - *Catatan*: Dropdown pilihan RS di halaman ingest tarif dan verifikasi klaim akan memuat data otomatis dari daftar RS ini.

3. **Upload Tarif RS**:
   - Formulir pengiriman dokumen tarif referensi PDF secara asinkron (`POST /tarif/upload`).
   - Monitor asinkron (polling langsung setiap 2,5 detik) yang menunjukkan progress text asli dari backend (*"Membaca PDF..."*, *"Membuat embedding..."*, dsb).

4. **Verifikasi Klaim**:
   - Antarmuka untuk melakukan unggah multi-file PDF tagihan dan rekam medis klaim pasien (`POST /klaim/verifikasi`).
   - Melakukan polling asinkron untuk melacak status analisis AI.
   - **Visualisasi Hasil**:
     - Keputusan akhir model diwarnai secara kontras (`LAYAK` = Hijau, `PERLU KLARIFIKASI` = Kuning, `TIDAK LAYAK` = Merah).
     - Visualisasi Confidence Score (0-100%).
     - **Mismatch Warning Banner**: Muncul secara mencolok jika terdeteksi perbedaan antara `jumlah_item` di laporan dengan `jumlah_item_diekstrak` dari sistem, memperingatkan verifikator manusia akan potensi data tagihan yang hilang.
     - Ringkasan Finansial: Total diajukan, Koreksi terverifikasi, Perlu klarifikasi, Rekomendasi pembayaran.
     - Alasan & poin penting temuan AI yang terdaftar dalam poin-poin terstruktur.
     - Tombol unduh laporan instan dalam 3 format berkas (`.xlsx`, `.md`, `.csv`).
     - **Disclaimer Permanen Wajib**: Banner penunjang keputusan (decision-support) yang mengingatkan bahwa keputusan akhir wajib direview oleh verifikator manusia.

5. **Riwayat Job**:
   - Menampilkan daftar lengkap seluruh pekerjaan (ingest tarif & verifikasi klaim) yang terdaftar di dalam sistem (`GET /jobs`).
   - Diurutkan dari yang terbaru (`tgl_dibuat`). Mengklik tombol "Lihat Detail" di riwayat akan memuat rincian hasil analisis yang tersimpan di dalam modal pop-up interaktif secara lengkap.

---

## 📂 Struktur Berkas & Modularitas Kode

Untuk menjaga kerapian, skalabilitas, dan kemudahan pemeliharaan (*maintainability*), struktur folder `frontend` telah dirapikan secara modular sebagai berikut:

```text
frontend/
├── .env                  # Konfigurasi variabel lingkungan (Base URL API)
├── index.html            # Entry point dokumen HTML utama
├── package.json          # Berkas konfigurasi npm dan dependensi
├── tsconfig.json         # Konfigurasi compiler TypeScript
├── vite.config.ts        # Konfigurasi Vite & plugin TailwindCSS v4
└── src/
    ├── main.tsx          # Entry point inisialisasi React
    ├── index.css         # Import TailwindCSS v4
    ├── types.ts          # Definisi tipe data kontrak API (RumahSakit, Job)
    ├── utils.ts          # Fungsi helper (formatRupiah, formatTanggal, getStatusColor, dll.)
    ├── App.tsx           # Orchestrator & State Manager utama
    └── components/       # Folder komponen UI modular hasil de-coupling
        ├── Sidebar.tsx            # Navigasi & Indikator Koneksi API
        ├── Header.tsx             # Judul dinamis & Tanggal hari ini
        ├── DashboardView.tsx      # Tampilan Ringkasan & 5 Job Terkini
        ├── RumahSakitView.tsx     # Form Ingest RS & Tabel Master RS
        ├── UploadTarifView.tsx    # Form Ingest Tarif RS & Monitor Live Progress Ingest
        ├── VerifikasiKlaimView.tsx# Form Upload Klaim & Monitor Live Progress Verifikasi
        ├── RiwayatView.tsx        # Tabel Lengkap Riwayat Pekerjaan
        └── JobDetailModal.tsx     # Modal pop-up rincian hasil verifikasi AI & download laporan
```

Setiap tampilan menu dan dialog modal didefinisikan ke dalam file terpisah di bawah folder `components`, sehingga `App.tsx` menjadi file orkestrator yang sangat ringan, bersih, dan mudah dibaca.

---

## ⚡ Modifikasi Backend (api.py)

Guna menyajikan riwayat pekerjaan yang rapi, kami telah menambahkan endpoint baru serta melengkapi metadata pembuatan job di backend:

1. **Endpoint Baru `GET /jobs`**:
   - Me-list isi dictionary `JOBS` secara lengkap.
   - Diurutkan berdasarkan timestamp pembuatan dari yang paling baru ke yang paling lama.
2. **Metadata `tgl_dibuat` pada `set_job`**:
   - Menambahkan field ISO timestamp string `tgl_dibuat` ketika pekerjaan asinkron pertama kali didaftarkan (di endpoint `POST /tarif/upload` dan `POST /klaim/verifikasi`).
