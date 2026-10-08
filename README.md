# VeriMedRS 🩺✨

VeriMedRS adalah sistem verifikasi tarif & klaim rumah sakit (RS) otomatis berbasis AI (Google Gemini) yang terintegrasi dengan pencarian dokumen tarif RS menggunakan vector search (PostgreSQL + pgvector). Proyek ini dirancang untuk memudahkan verifikator medis memproses data institusi Rumah Sakit, mengunggah tarif referensi, serta memverifikasi kepatuhan tagihan klaim.

---

## 📂 Struktur Folder Proyek

```text
verimedrs/
├── backend/                  # REST API Backend (FastAPI, Python)
│   ├── api.py
│   ├── pdf_to_db.py
│   ├── claim_verifier.py
│   ├── konfigurasi.py        # Central configuration (path & models)
│   ├── prompt/
│   │   └── system_prompt_verifikator.md
│   ├── sql/
│   │   └── 001_create_db_rs_dokumen.sql
│   └── requirements.txt
├── frontend/                 # SPA Frontend (React, TypeScript, TailwindCSS)
├── data/                     # Folder penyimpanan berkas & cache local (.gitignore)
├── docs/                     # Dokumentasi pendukung & contoh integrasi HTML
│   ├── frontend.md
│   └── contoh_frontend.html
├── CLAUDE.md                 # Konvensi kode, pedoman tim, & aturan ketat developer
└── README.md                 # Berkas panduan ini
```

---

## 🛠️ Cara Setup & Menjalankan Aplikasi

### 1. Persiapan Database
Pastikan PostgreSQL Anda sudah aktif dan modul **pgvector** sudah di-enable. Jalankan skrip di `backend/sql/001_create_db_rs_dokumen.sql` untuk membuat tabel-tabel master dan indeks pencarian vektor.

### 2. Setup Backend
1. Masuk ke direktori `backend/`:
   ```bash
   cd backend
   ```
2. Buat file `.env` dari `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Catatan: Masukkan nilai `GEMINI_API_KEY` dan `DATABASE_URL` Anda.*
3. Install dependensi Python:
   ```bash
   pip install -r requirements.txt
   ```
4. Jalankan REST API server:
   ```bash
   python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
   ```

### 3. Setup Frontend
1. Masuk ke direktori `frontend/`:
   ```bash
   cd frontend
   ```
2. Jalankan aplikasi frontend (Vite):
   ```bash
   npm run dev
   ```
3. Akses antarmuka web di browser pada alamat `http://localhost:5173`.

---

## 📖 Dokumentasi Terkait

Untuk panduan lebih mendalam, silakan baca dokumentasi berikut:
- **Konvensi & Aturan Pengembang**: Baca [CLAUDE.md](./CLAUDE.md)
- **Dokumentasi Lengkap Frontend**: Baca [docs/frontend.md](./docs/frontend.md)
- **Uji Integrasi API Sederhana**: Buka [docs/contoh_frontend.html](./docs/contoh_frontend.html)
