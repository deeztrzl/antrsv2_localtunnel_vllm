-- Extension pgvector diperlukan untuk menyimpan dan mencarian embedding (vector search)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabel Rumah Sakit (Master Data)
CREATE TABLE IF NOT EXISTS rumahsakit (
    id SERIAL PRIMARY KEY,
    kode VARCHAR(50) NOT NULL UNIQUE,
    nama_rs VARCHAR(255) NOT NULL,
    alamat TEXT NOT NULL
);

-- Tabel Dokumen Tarif RS
CREATE TABLE IF NOT EXISTS dokumen (
    id SERIAL PRIMARY KEY,
    rumah_sakit_id INTEGER NOT NULL REFERENCES rumahsakit(id) ON DELETE CASCADE,
    nama_dokumen VARCHAR(255) NOT NULL,
    tgl_berlaku_awal DATE NOT NULL,
    tgl_berlaku_akhir DATE
);

-- Tabel Chunk Dokumen & Embeddingnya
CREATE TABLE IF NOT EXISTS dokumen_chunk (
    id SERIAL PRIMARY KEY,
    dokumen_id INTEGER NOT NULL REFERENCES dokumen(id) ON DELETE CASCADE,
    no_chunk INTEGER NOT NULL,
    isi_chunk TEXT NOT NULL,
    embedding vector(384) NOT NULL
);

-- Index untuk mempercepat vector search menggunakan jarak Cosine (operator <=>)
CREATE INDEX IF NOT EXISTS idx_dokumen_chunk_embedding_cosine 
ON dokumen_chunk USING hnsw (embedding vector_cosine_ops);
