export interface RumahSakit {
  id: number;
  kode: string;
  nama_rs: string;
  alamat: string;
}

export interface Job {
  job_id: string;
  status: "pending" | "processing" | "done" | "error";
  jenis: "ingest_tarif" | "verifikasi_klaim";
  pesan: string;
  tgl_dibuat?: string;
  dokumen_id?: number;
  jumlah_chunk?: number;
  keputusan?: {
    status: string;
    total_diajukan: number;
    koreksi_terverifikasi: number;
    perlu_klarifikasi: number;
    rekomendasi_pembayaran: number;
    alasan: string[];
  };
  confidence_score?: number;
  jumlah_item?: number;
  jumlah_item_diekstrak?: number;
  files?: {
    md: string;
    xlsx: string;
    csv: string;
  };
}
