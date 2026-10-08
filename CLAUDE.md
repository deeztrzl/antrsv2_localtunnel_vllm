# Panduan Pengembangan VeriMedRS (CLAUDE.md)

Dokumen ini berisi konvensi, instruksi setup, cara menjalankan, serta struktur file untuk proyek VeriMedRS.

---

## 📂 Struktur File Terorganisir

```text
verimedrs/ (root directory: antrsv2/)
├── backend/
│   ├── api.py                       # REST API Backend (FastAPI)
│   ├── pdf_to_db.py                 # Pipeline ingest tarif PDF ke database
│   ├── claim_verifier.py            # Agent analisis & verifikasi klaim pasien
│   ├── konfigurasi.py               # Satu tempat terpusat untuk konfigurasi path & model
│   ├── prompt/
│   │   └── system_prompt_verifikator.md # Prompt utama untuk agen verifikasi
│   ├── sql/
│   │   └── 001_create_db_rs_dokumen.sql # Schema migrasi database PostgreSQL
│   ├── requirements.txt             # Dependensi Python
│   └── .env.example                 # Contoh variabel lingkungan
├── frontend/                        # Source code frontend (React + TypeScript)
├── data/                            # Folder penyimpanan lokal (diabaikan oleh git)
│   ├── laporan_klaim/               # Hasil laporan verifikasi (.md, .xlsx, .csv) & cache
│   └── output_debug/                # Hasil ekstraksi tarif RS mentah (.json, .md)
├── docs/
│   ├── frontend.md                  # Dokumentasi detil frontend
│   └── contoh_frontend.html         # Halaman integrasi HTML minimalis untuk tes
├── CLAUDE.md                        # Dokumen ini (panduan & aturan developer)
├── README.md                        # Panduan ringkas setup & cara menjalankan
└── .gitignore                       # File exclusion list untuk git
```

---

## 🛠️ Panduan Setup

### Prasyarat
1. **PostgreSQL** versi 15+ dengan ekstensi **pgvector** terpasang.
2. **Python 3.10 - 3.12** dengan virtual environment aktif.
3. **Node.js** versi 20+ (untuk frontend).

### Setup Backend
1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Salin contoh `.env` dan sesuaikan nilainya:
   ```bash
   cp .env.example .env
   ```
   Isi `GEMINI_API_KEY` dan `DATABASE_URL` di dalam berkas `.env`.
3. Pasang semua dependensi:
   ```bash
   pip install -r requirements.txt
   ```

### Setup Frontend
1. Masuk ke direktori frontend:
   ```bash
   cd frontend
   ```
2. Folder `node_modules` telah disiapkan secara lokal untuk kemudahan instalasi offline. Jika dalam lingkungan baru, jalankan:
   ```bash
   npm install
   ```
3. Pastikan berkas `.env` di dalam folder `frontend` berisi alamat API backend yang benar (default: `VITE_API_BASE_URL=http://localhost:8000`).

---

## 🚀 Cara Pakai Cepat

### Menjalankan Backend
Jalankan FastAPI server menggunakan uvicorn dari folder `backend/`:
```bash
cd backend
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```
Akses Swagger API Documentation di `http://localhost:8000/docs`.

### Menjalankan Ingest Tarif (pdf_to_db.py)
Jalankan dari dalam folder `backend/`:
```bash
python pdf_to_db.py \
    --pdf "../TARIF PELNI.pdf" \
    --kode-rs RS001 \
    --nama-dokumen "Tarif Rawat Inap 2026" \
    --tgl-berlaku-awal 2026-01-01 \
    --dsn "postgresql://admin:12345678@localhost:5433/poc_rdbms"
```

### Menjalankan Verifikasi Klaim (claim_verifier.py)
Jalankan dari dalam folder `backend/`:
```bash
python claim_verifier.py \
    --kode-rs RS001 \
    --claim-docs "../TAGIHAN.pdf" \
    --dsn "postgresql://admin:12345678@localhost:5433/poc_rdbms"
```

### Menjalankan Frontend
Jalankan dari dalam folder `frontend/`:
```bash
cd frontend
npm run dev
```
Buka `http://localhost:5173` di browser Anda.

---

## ⚙️ Konvensi Kode & Aturan Ketat

Sebagai pengembang, Anda wajib mematuhi konvensi berikut untuk menjaga konsistensi codebase level POC ini:

1. **Bahasa Penulisan**:
   - Seluruh komentar kode, nama fungsi baru, variabel, dokumentasi, dan log output wajib menggunakan **Bahasa Indonesia** yang baik dan jelas.

2. **Aturan Panggilan API Gemini**:
   - Seluruh pemanggilan model LLM Gemini wajib dibungkus melalui fungsi `panggil_gemini()`.
   - **JANGAN** pernah memanggil `client.models.generate_content` secara langsung untuk menjamin berjalannya fungsi logging token serta mekanisme retry otomatis.

3. **Fungsi Formatting Data Excel/CSV**:
   - Fungsi `sel()` dan `angka()` dalam manipulasi file Excel dan CSV adalah elemen kritis yang berfungsi untuk membersihkan karakter ilegal dan memvalidasi tipe data numerik dari model Gemini yang sering kali tidak konsisten.
   - **JANGAN** pernah menghapus atau mengubah kedua fungsi pembantu ini.

4. **Retry Logic**:
   - Logika retry dengan *exponential backoff* wajib dipertahankan untuk mengantisipasi kegagalan jaringan atau batasan rate-limiting dari API Gemini.

---

## ⚠️ Belum Aman untuk Produksi (Daftar Isu Lama)

Aplikasi ini saat ini masih berada pada level **Proof of Concept (POC)**. Beberapa aspek berikut belum aman untuk produksi dan butuh perhatian khusus sebelum dideploy:
- **Keamanan database**: Connection string DSN dikirim langsung lewat argumen CLI dan belum di-enkripsi.
- **Autentikasi**: REST API di `api.py` belum memiliki mekanisme otorisasi atau token JWT. CORS diaktifkan secara liar (`allow_origins=["*"]`).
- **Penyimpanan Berkas**: File diunggah langsung ke penyimpanan disk lokal server. Untuk skala besar, sebaiknya dipindahkan ke Cloud Storage (S3 / GCS).
- **Penanganan Concurrent Requests**: Worker background thread saat ini menggunakan pool sederhana dengan kapasitas maksimal 2 worker, yang belum didesain untuk beban konkurensi tinggi.
