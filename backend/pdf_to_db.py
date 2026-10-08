#!/usr/bin/env python3
"""
pdf_to_db.py
============
Pipeline untuk dokumen tarif rumah sakit (PDF teks asli, banyak tabel):

    PDF -> ekstrak teks & tabel -> gabung jadi Markdown/JSON
        -> chunking (per baris tabel + per paragraf teks)
        -> embedding (lokal, CPU, tanpa API key)
        -> INSERT ke PostgreSQL (tabel `dokumen` & `dokumen_chunk`)

Dirancang untuk laptop biasa: semua library yang dipakai murni CPU,
tidak butuh GPU dan tidak butuh koneksi internet setelah model diunduh
sekali di awal.

Cara pakai:
    python pdf_to_db.py \
        --pdf tarif_rs_a.pdf \
        --kode-rs RS001 \
        --nama-dokumen "Tarif Rawat Inap 2026" \
        --tgl-berlaku-awal 2026-01-01 \
        --dsn "postgresql://user:pass@localhost:5432/namadb"

Lihat requirements.txt untuk daftar dependensi.
"""

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

import camelot
import pdfplumber
import psycopg2
import psycopg2.extras
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Konfigurasi
# ---------------------------------------------------------------------------

from konfigurasi import EMBEDDING_MODEL_NAME, EMBEDDING_DIM, DIR_OUTPUT_DEBUG

# Target panjang chunk teks biasa (bukan baris tabel), dalam karakter.
TEXT_CHUNK_TARGET_CHARS = 800


# ---------------------------------------------------------------------------
# 1. Ekstraksi PDF -> struktur menengah
# ---------------------------------------------------------------------------

def extract_pdf(pdf_path: str) -> dict:
    """
    Membaca PDF dan mengembalikan struktur per halaman:
    {
        "pages": [
            {
                "page_number": 1,
                "text": "...",       # teks biasa halaman (tanpa isi tabel)
                "tables": [          # daftar tabel di halaman ini
                    {"table_index": 0, "rows": [[...], [...]]},
                    ...
                ]
            },
            ...
        ]
    }
    """
    pages = []

    # --- Teks per halaman, pakai pdfplumber ---
    with pdfplumber.open(pdf_path) as pdf:
        page_texts = [p.extract_text() or "" for p in pdf.pages]

    # --- Tabel, pakai camelot mode lattice (tabel bergaris) ---
    # Kalau tabelmu tidak bergaris, ganti flavor="lattice" -> flavor="stream".
    try:
        camelot_tables = camelot.read_pdf(pdf_path, pages="all", flavor="lattice")
    except Exception as e:
        print(f"[WARN] Camelot gagal membaca tabel: {e}", file=sys.stderr)
        camelot_tables = []

    tables_by_page = {}
    for idx, t in enumerate(camelot_tables):
        page_no = int(t.page)
        rows = t.df.values.tolist()
        tables_by_page.setdefault(page_no, []).append(
            {"table_index": idx, "rows": rows}
        )

    for i, text in enumerate(page_texts):
        page_no = i + 1
        pages.append(
            {
                "page_number": page_no,
                "text": text.strip(),
                "tables": tables_by_page.get(page_no, []),
            }
        )

    return {"pages": pages}


# ---------------------------------------------------------------------------
# 2. Struktur menengah -> Markdown & JSON
# ---------------------------------------------------------------------------

def table_rows_to_markdown(rows: list) -> str:
    """Ubah daftar baris tabel jadi tabel Markdown. Baris pertama = header."""
    if not rows:
        return ""
    header, *body = rows
    header = [str(c).strip().replace("\n", " ") for c in header]
    md = ["| " + " | ".join(header) + " |"]
    md.append("| " + " | ".join(["---"] * len(header)) + " |")
    for row in body:
        row = [str(c).strip().replace("\n", " ") for c in row]
        md.append("| " + " | ".join(row) + " |")
    return "\n".join(md)


def build_markdown_and_json(extracted: dict, nama_dokumen: str) -> tuple[str, dict]:
    """
    Gabungkan teks + tabel per halaman jadi satu dokumen Markdown,
    dan struktur JSON yang sejajar untuk disimpan sebagai arsip.
    """
    md_parts = [f"# {nama_dokumen}\n"]
    json_doc = {"nama_dokumen": nama_dokumen, "pages": []}

    for page in extracted["pages"]:
        md_parts.append(f"\n## Halaman {page['page_number']}\n")
        if page["text"]:
            md_parts.append(page["text"])

        page_json = {
            "page_number": page["page_number"],
            "text": page["text"],
            "tables": [],
        }

        for tbl in page["tables"]:
            md_table = table_rows_to_markdown(tbl["rows"])
            md_parts.append(f"\n{md_table}\n")
            page_json["tables"].append(
                {"table_index": tbl["table_index"], "rows": tbl["rows"]}
            )

        json_doc["pages"].append(page_json)

    markdown_text = "\n".join(md_parts)
    return markdown_text, json_doc


# ---------------------------------------------------------------------------
# 3. Chunking
# ---------------------------------------------------------------------------

def chunk_paragraph_text(text: str, page_number: int) -> list:
    """
    Pecah teks biasa (non-tabel) jadi chunk sepanjang TEXT_CHUNK_TARGET_CHARS,
    dipecah pada batas paragraf/kalimat bila memungkinkan.
    """
    if not text.strip():
        return []

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks = []
    buf = ""

    for para in paragraphs:
        if len(buf) + len(para) + 1 <= TEXT_CHUNK_TARGET_CHARS:
            buf = f"{buf}\n{para}".strip()
        else:
            if buf:
                chunks.append(buf)
            buf = para

    if buf:
        chunks.append(buf)

    return [
        {"isi_chunk": c, "sumber": f"halaman {page_number}, teks"} for c in chunks
    ]


def chunk_table_rows(
    rows: list, page_number: int, table_index: int, judul_konteks: str = ""
) -> list:
    """
    Ubah setiap baris tabel jadi satu chunk berupa kalimat, bukan baris mentah.
    Ini yang membuat pencarian vector akurat untuk pertanyaan seperti
    "berapa tarif rawat inap kelas 1?" -- lihat diskusi sebelumnya di chat ini.

    Asumsi: baris pertama (index 0) adalah header kolom.
    """
    if not rows or len(rows) < 2:
        return []

    header = [str(c).strip() for c in rows[0]]
    chunks = []

    for row in rows[1:]:
        row = [str(c).strip() for c in row]
        if not any(row):
            continue  # lewati baris kosong

        pasangan = [
            f"{h}: {v}" for h, v in zip(header, row) if h and v
        ]
        kalimat = ", ".join(pasangan)
        if judul_konteks:
            kalimat = f"{judul_konteks}. {kalimat}"

        chunks.append(
            {
                "isi_chunk": kalimat,
                "sumber": f"halaman {page_number}, tabel {table_index}",
            }
        )

    return chunks


def build_all_chunks(extracted: dict, nama_dokumen: str) -> list:
    """Kumpulkan semua chunk (teks + tabel) dari seluruh halaman, sudah diberi no_chunk berurutan."""
    raw_chunks = []

    for page in extracted["pages"]:
        raw_chunks.extend(
            chunk_paragraph_text(page["text"], page["page_number"])
        )
        for tbl in page["tables"]:
            raw_chunks.extend(
                chunk_table_rows(
                    tbl["rows"],
                    page["page_number"],
                    tbl["table_index"],
                    judul_konteks=nama_dokumen,
                )
            )

    for i, c in enumerate(raw_chunks):
        c["no_chunk"] = i

    return raw_chunks


# ---------------------------------------------------------------------------
# 4. Embedding
# ---------------------------------------------------------------------------

def embed_chunks(chunks: list, model: SentenceTransformer) -> None:
    """Isi embedding untuk tiap chunk, in-place, secara batch (lebih cepat)."""
    texts = [c["isi_chunk"] for c in chunks]
    if not texts:
        return
    vectors = model.encode(texts, batch_size=32, show_progress_bar=True)
    for c, v in zip(chunks, vectors):
        c["embedding"] = v.tolist()


# ---------------------------------------------------------------------------
# 5. Insert ke PostgreSQL
# ---------------------------------------------------------------------------

def insert_dokumen_dan_chunks(
    dsn: str,
    kode_rs: str,
    nama_dokumen: str,
    tgl_berlaku_awal: str,
    tgl_berlaku_akhir: str | None,
    chunks: list,
) -> int:
    """
    Insert satu baris ke `dokumen` (butuh rumah_sakit_id dari `kode_rs`),
    lalu insert semua chunk ke `dokumen_chunk`. Mengembalikan dokumen_id.
    """
    conn = psycopg2.connect(dsn)
    try:
        with conn, conn.cursor() as cur:
            # Cari rumah_sakit_id dari kode
            # (nama tabel: `rumahsakit`, sesuaikan di sini kalau kamu ganti nama tabelnya)
            cur.execute(
                "SELECT id FROM rumahsakit WHERE kode = %s;", (kode_rs,)
            )
            row = cur.fetchone()
            if row is None:
                raise ValueError(
                    f"Kode rumah sakit '{kode_rs}' tidak ditemukan. "
                    f"Pastikan sudah di-insert ke tabel rumah_sakit."
                )
            rumah_sakit_id = row[0]

            # Insert dokumen
            cur.execute(
                """
                INSERT INTO dokumen
                    (rumah_sakit_id, nama_dokumen, tgl_berlaku_awal, tgl_berlaku_akhir)
                VALUES (%s, %s, %s, %s)
                RETURNING id;
                """,
                (rumah_sakit_id, nama_dokumen, tgl_berlaku_awal, tgl_berlaku_akhir),
            )
            dokumen_id = cur.fetchone()[0]

            # Insert semua chunk sekaligus (execute_values -> jauh lebih cepat
            # daripada insert satu-satu untuk ratusan baris)
            values = [
                (
                    dokumen_id,
                    c["no_chunk"],
                    c["isi_chunk"],
                    c["embedding"],
                )
                for c in chunks
            ]
            psycopg2.extras.execute_values(
                cur,
                """
                INSERT INTO dokumen_chunk (dokumen_id, no_chunk, isi_chunk, embedding)
                VALUES %s;
                """,
                values,
                template="(%s, %s, %s, %s::vector)",
            )

        return dokumen_id
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf", required=True, help="Path ke file PDF tarif")
    parser.add_argument("--kode-rs", required=True, help="Kode rumah sakit (harus sudah ada di tabel rumah_sakit)")
    parser.add_argument("--nama-dokumen", required=True, help="Nama dokumen, mis. 'Tarif Rawat Inap 2026'")
    parser.add_argument("--tgl-berlaku-awal", required=True, help="Format YYYY-MM-DD")
    parser.add_argument("--tgl-berlaku-akhir", default=None, help="Format YYYY-MM-DD, opsional")
    parser.add_argument("--dsn", required=True, help="Connection string PostgreSQL, mis. postgresql://user:pass@localhost:5432/db")
    parser.add_argument("--out-dir", default=str(DIR_OUTPUT_DEBUG), help="Folder untuk simpan hasil .md dan .json (arsip)")
    parser.add_argument("--skip-db", action="store_true", help="Hanya hasilkan .md/.json, jangan insert ke DB (untuk cek hasil dulu)")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        sys.exit(f"File tidak ditemukan: {pdf_path}")

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"[1/5] Membaca PDF: {pdf_path}")
    extracted = extract_pdf(str(pdf_path))

    print("[2/5] Menyusun Markdown & JSON")
    markdown_text, json_doc = build_markdown_and_json(extracted, args.nama_dokumen)

    stem = pdf_path.stem
    md_path = out_dir / f"{stem}.md"
    json_path = out_dir / f"{stem}.json"
    md_path.write_text(markdown_text, encoding="utf-8")
    json_path.write_text(json.dumps(json_doc, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"      -> disimpan: {md_path}")
    print(f"      -> disimpan: {json_path}")

    print("[3/5] Membuat chunk (per paragraf & per baris tabel)")
    chunks = build_all_chunks(extracted, args.nama_dokumen)
    print(f"      -> total {len(chunks)} chunk")

    if not chunks:
        sys.exit("Tidak ada chunk yang dihasilkan. Cek isi PDF-nya.")

    print(f"[4/5] Membuat embedding (model: {EMBEDDING_MODEL_NAME}, jalan di CPU)")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    embed_chunks(chunks, model)

    if args.skip_db:
        print("[5/5] --skip-db aktif, tidak insert ke database. Selesai.")
        return

    print("[5/5] Insert ke PostgreSQL")
    dokumen_id = insert_dokumen_dan_chunks(
        dsn=args.dsn,
        kode_rs=args.kode_rs,
        nama_dokumen=args.nama_dokumen,
        tgl_berlaku_awal=args.tgl_berlaku_awal,
        tgl_berlaku_akhir=args.tgl_berlaku_akhir,
        chunks=chunks,
    )
    print(f"      -> selesai. dokumen_id = {dokumen_id}, jumlah chunk = {len(chunks)}")


if __name__ == "__main__":
    main()
