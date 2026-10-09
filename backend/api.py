#!/usr/bin/env python3
"""
api.py
======
REST API untuk sistem verifikasi tarif & klaim RS, supaya bisa diintegrasikan ke frontend.

Dua fitur utama dibungkus sebagai HTTP endpoint:
  1. Upload dokumen tarif RS  -> ingest ke database (pipeline pdf_to_db.py)
  2. Upload dokumen klaim     -> verifikasi lewat agent (pipeline claim_verifier.py)

Karena kedua proses ini lama (baca PDF + beberapa kali panggil LLM), semua endpoint
upload bersifat ASINKRON: kamu upload file, dapat job_id, lalu polling status sampai
selesai. Ini supaya frontend tidak perlu menunggu 1-2 menit dalam satu request HTTP.

Konfigurasi lewat file .env (lihat .env.example):
    DATABASE_URL=postgresql://admin:pass@localhost:5433/poc_rdbms

    # Server VLM (baca dokumen / gambar). Kalau VLM_BASE_URL kosong, server LLM dipakai untuk keduanya.
    VLM_BASE_URL=https://aaaa.trycloudflare.com/v1
    VLM_MODEL=nama-model-vlm-dari-/v1/models
    VLM_API_KEY=EMPTY
    VLM_MAX_CONTEXT=8192

    # Server LLM (interpretasi / analisis)
    LLM_BASE_URL=https://bbbb.trycloudflare.com/v1
    LLM_MODEL=nama-model-llm-dari-/v1/models
    LLM_API_KEY=EMPTY
    LLM_MAX_CONTEXT=32768

Jalankan:
    uvicorn api:app --host 0.0.0.0 --port 8000 --reload

Dokumentasi interaktif otomatis tersedia di: http://localhost:8000/docs
"""

import os
import shutil
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Lock
from typing import Optional

import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from openai import OpenAI
from sentence_transformers import SentenceTransformer

# Muat .env SEBELUM membaca os.environ di bawah.
load_dotenv(Path(__file__).parent / ".env", override=True)

from pdf_to_db import (
    EMBEDDING_MODEL_NAME,
    build_all_chunks,
    build_markdown_and_json,
    embed_chunks,
    extract_pdf,
    insert_dokumen_dan_chunks,
)
import claim_verifier as cv  # dipakai untuk membaca MODEL_EKSTRAKSI / MODEL_ANALISIS terbaru (nilainya berubah saat muat_ulang_konfigurasi)
from claim_verifier import (
    analisis_klaim,
    baca_semua_dokumen_klaim,
    buat_llm_client,
    cek_server_llm,
    muat_ulang_konfigurasi,
    ekstrak_item_tagihan,
    lengkapi_item_dengan_tarif,
    tulis_laporan_csv,
    tulis_laporan_excel,
    tulis_laporan_markdown,
)

# ---------------------------------------------------------------------------
# Konfigurasi
# ---------------------------------------------------------------------------

DATABASE_URL = os.environ.get("DATABASE_URL")

from konfigurasi import (
    DIR_UPLOADS as UPLOAD_DIR,
    DIR_LAPORAN as OUTPUT_DIR,
    PATH_SYSTEM_PROMPT as SYSTEM_PROMPT_PATH,
)

app = FastAPI(title="API Verifikasi Tarif & Klaim RS")

# CORS dibuka lebar untuk pengembangan. Di produksi, ganti allow_origins dengan
# domain frontend kamu yang sebenarnya, jangan biarkan "*".
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model embedding & client LLM dimuat SEKALI saat API start, dipakai ulang
# untuk semua request -- memuat ulang setiap request akan sangat lambat.
_embed_model: Optional[SentenceTransformer] = None
_llm_client: Optional[OpenAI] = None
_executor = ThreadPoolExecutor(max_workers=2)  # proses berat jalan di background thread

JOBS: dict = {}
_jobs_lock = Lock()


def get_embed_model() -> SentenceTransformer:
    global _embed_model
    if _embed_model is None:
        _embed_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _embed_model


def get_llm_client() -> OpenAI:
    """Client server LLM (analisis). Dibuat baru tiap job dari environment terbaru (lihat _segarkan_konfigurasi), tanpa cache."""
    base_url = os.environ.get("LLM_BASE_URL")
    if not base_url:
        raise RuntimeError("LLM_BASE_URL belum diset di file .env")
    return buat_llm_client(base_url, os.environ.get("LLM_API_KEY", "EMPTY"))


def get_vlm_client() -> OpenAI:
    """Client server VLM (baca dokumen/gambar). Kalau VLM_BASE_URL kosong, memakai server LLM (URL dan API key-nya)."""
    base_url = os.environ.get("VLM_BASE_URL")
    if not base_url:
        return get_llm_client()
    return buat_llm_client(base_url, os.environ.get("VLM_API_KEY", "EMPTY"))


def _segarkan_konfigurasi() -> None:
    """Baca ulang .env di awal tiap job: URL tunnel/model/DB yang diedit berlaku tanpa restart uvicorn."""
    global DATABASE_URL
    muat_ulang_konfigurasi()
    DATABASE_URL = os.environ.get("DATABASE_URL")


def set_job(job_id: str, **kwargs) -> None:
    with _jobs_lock:
        JOBS.setdefault(job_id, {}).update(kwargs)


@app.on_event("startup")
def startup():
    if not DATABASE_URL:
        print("[WARN] DATABASE_URL belum diset -- endpoint yang butuh database akan gagal.")
    if not os.environ.get("LLM_BASE_URL"):
        print("[WARN] LLM_BASE_URL belum diset -- endpoint verifikasi klaim akan gagal.")
    if not os.environ.get("VLM_BASE_URL"):
        print("[INFO] VLM_BASE_URL belum diset -- server LLM dipakai juga untuk membaca dokumen/gambar.")


# ---------------------------------------------------------------------------
# Rumah sakit
# ---------------------------------------------------------------------------

@app.post("/rumah-sakit")
def buat_rumah_sakit(kode: str = Form(...), nama_rs: str = Form(...), alamat: str = Form("")):
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO rumahsakit (kode, nama_rs, alamat) VALUES (%s, %s, %s) RETURNING id;",
                (kode, nama_rs, alamat),
            )
            new_id = cur.fetchone()[0]
        return {"id": new_id, "kode": kode, "nama_rs": nama_rs}
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(409, f"Kode rumah sakit '{kode}' sudah ada")
    finally:
        conn.close()


@app.get("/rumah-sakit")
def daftar_rumah_sakit():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, kode, nama_rs, alamat FROM rumahsakit ORDER BY nama_rs;")
            rows = cur.fetchall()
        return [{"id": r[0], "kode": r[1], "nama_rs": r[2], "alamat": r[3]} for r in rows]
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Upload tarif -> ingest ke database (job asinkron)
# ---------------------------------------------------------------------------

def _job_ingest_tarif(job_id: str, pdf_path: Path, kode_rs: str, nama_dokumen: str, tgl_awal: str, tgl_akhir: Optional[str]):
    try:
        set_job(job_id, status="processing", pesan="Membaca PDF...")
        extracted = extract_pdf(str(pdf_path))

        set_job(job_id, pesan="Membuat chunk...")
        chunks = build_all_chunks(extracted, nama_dokumen)
        if not chunks:
            set_job(job_id, status="error", pesan="Tidak ada chunk yang dihasilkan dari PDF ini.")
            return

        set_job(job_id, pesan=f"Membuat embedding untuk {len(chunks)} chunk...")
        embed_chunks(chunks, get_embed_model())

        set_job(job_id, pesan="Menyimpan ke database...")
        dokumen_id = insert_dokumen_dan_chunks(DATABASE_URL, kode_rs, nama_dokumen, tgl_awal, tgl_akhir, chunks)

        set_job(job_id, status="done", pesan="Selesai", dokumen_id=dokumen_id, jumlah_chunk=len(chunks))
    except Exception as e:
        set_job(job_id, status="error", pesan=str(e))
    finally:
        pdf_path.unlink(missing_ok=True)


@app.post("/tarif/upload")
def upload_tarif(
    file: UploadFile = File(...),
    kode_rs: str = Form(...),
    nama_dokumen: str = Form(...),
    tgl_berlaku_awal: str = Form(...),
    tgl_berlaku_akhir: Optional[str] = Form(None),
):
    job_id = str(uuid.uuid4())
    dest = UPLOAD_DIR / f"{job_id}_{file.filename}"
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    from datetime import datetime
    tgl_sekarang = datetime.now().isoformat()
    set_job(job_id, status="pending", jenis="ingest_tarif", pesan="Menunggu diproses...", tgl_dibuat=tgl_sekarang)
    _executor.submit(_job_ingest_tarif, job_id, dest, kode_rs, nama_dokumen, tgl_berlaku_awal, tgl_berlaku_akhir)

    return {"job_id": job_id, "status": "pending"}


# ---------------------------------------------------------------------------
# Upload klaim -> verifikasi (job asinkron)
# ---------------------------------------------------------------------------

def _job_verifikasi_klaim(job_id: str, pdf_paths: list, kode_rs: str):
    try:
        set_job(job_id, status="processing", pesan="Memeriksa server VLM & LLM...")
        _segarkan_konfigurasi()
        client_llm = get_llm_client()   # analisis / interpretasi
        client_vlm = get_vlm_client()   # baca dokumen / gambar
        # gagal cepat (<20 dtk per server) kalau tunnel mati, sebelum PDF dibaca
        cek_server_llm(client_vlm, [cv.MODEL_EKSTRAKSI])
        cek_server_llm(client_llm, [cv.MODEL_ANALISIS])

        set_job(job_id, pesan="Membaca dokumen klaim...")
        teks_klaim, gambar_halaman = baca_semua_dokumen_klaim([str(p) for p in pdf_paths])

        set_job(job_id, pesan="Ekstraksi item tagihan...")
        items = ekstrak_item_tagihan(client_vlm, teks_klaim, gambar_halaman)

        set_job(job_id, pesan=f"Mencari tarif pembanding untuk {len(items)} item...")
        conn = psycopg2.connect(DATABASE_URL)
        try:
            items = lengkapi_item_dengan_tarif(conn, get_embed_model(), kode_rs, items)
        finally:
            conn.close()

        set_job(job_id, pesan="Analisis akhir...")
        system_prompt = SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")
        hasil = analisis_klaim(client_llm, system_prompt, teks_klaim, items,
                               gambar_halaman=gambar_halaman, client_vlm=client_vlm)

        stem = f"laporan_{job_id}"
        md_path = OUTPUT_DIR / f"{stem}.md"
        xlsx_path = OUTPUT_DIR / f"{stem}.xlsx"
        csv_path = OUTPUT_DIR / f"{stem}.csv"
        tulis_laporan_markdown(hasil, md_path)
        tulis_laporan_excel(hasil, xlsx_path)
        tulis_laporan_csv(hasil, csv_path)

        set_job(
            job_id,
            status="done",
            pesan="Selesai",
            keputusan=hasil.get("keputusan_akhir", {}),
            confidence_score=hasil.get("confidence_score"),
            peringatan=hasil.get("peringatan", []),
            cakupan_tarif=hasil.get("cakupan_tarif"),
            jumlah_item=len(hasil.get("tabel_item", [])),
            jumlah_item_diekstrak=len([i for i in items if not i.get("_agregat")]),
            files={"md": f"{stem}.md", "xlsx": f"{stem}.xlsx", "csv": f"{stem}.csv"},
        )
    except BaseException as e:
        # BaseException (bukan Exception) karena claim_verifier memakai sys.exit() saat
        # parse JSON gagal; SystemExit tidak tertangkap oleh `except Exception` dan
        # job akan menggantung di status "processing" selamanya.
        pesan = str(e) if str(e) else e.__class__.__name__
        set_job(job_id, status="error", pesan=pesan)
    finally:
        for p in pdf_paths:
            Path(p).unlink(missing_ok=True)


@app.post("/klaim/verifikasi")
def verifikasi_klaim(kode_rs: str = Form(...), files: list[UploadFile] = File(...)):
    job_id = str(uuid.uuid4())
    saved_paths = []
    for f in files:
        dest = UPLOAD_DIR / f"{job_id}_{f.filename}"
        with dest.open("wb") as out:
            shutil.copyfileobj(f.file, out)
        saved_paths.append(dest)

    from datetime import datetime
    tgl_sekarang = datetime.now().isoformat()
    set_job(job_id, status="pending", jenis="verifikasi_klaim", pesan="Menunggu diproses...", tgl_dibuat=tgl_sekarang)
    _executor.submit(_job_verifikasi_klaim, job_id, saved_paths, kode_rs)

    return {"job_id": job_id, "status": "pending"}


# ---------------------------------------------------------------------------
# Status job (dipakai untuk kedua jenis job) + download hasil
# ---------------------------------------------------------------------------

@app.get("/jobs")
def list_jobs():
    with _jobs_lock:
        sorted_jobs = []
        for jid, job in JOBS.items():
            job_info = {"job_id": jid, **job}
            sorted_jobs.append(job_info)
        # Sort by tgl_dibuat descending
        sorted_jobs.sort(key=lambda x: x.get("tgl_dibuat", ""), reverse=True)
    return sorted_jobs


@app.get("/jobs/{job_id}")
def status_job(job_id: str):
    with _jobs_lock:
        job = JOBS.get(job_id)
    if job is None:
        raise HTTPException(404, "Job tidak ditemukan")
    return {"job_id": job_id, **job}


@app.get("/jobs/{job_id}/download/{jenis}")
def download_laporan(job_id: str, jenis: str):
    with _jobs_lock:
        job = JOBS.get(job_id)
    if job is None or job.get("status") != "done" or "files" not in job:
        raise HTTPException(404, "Laporan belum tersedia untuk job ini")
    if jenis not in job["files"]:
        raise HTTPException(400, f"Jenis file tidak dikenal: {jenis} (pilih: md, xlsx, csv)")

    path = OUTPUT_DIR / job["files"][jenis]
    if not path.exists():
        raise HTTPException(404, "File laporan tidak ditemukan di server")

    media_types = {
        "md": "text/markdown",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "csv": "text/csv",
    }
    return FileResponse(path, media_type=media_types[jenis], filename=job["files"][jenis])


@app.get("/health")
def health():
    return {"status": "ok"}
