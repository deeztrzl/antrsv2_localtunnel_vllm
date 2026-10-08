import React from "react";
import { XCircle, CheckCircle2, AlertTriangle, FileSpreadsheet, FileText, FileCode, Info } from "lucide-react";
import { Job } from "../types";
import { formatTanggal, formatRupiah, getKeputusanStatusColor } from "../utils";

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";

interface Props {
  detailModalOpen: boolean;
  setDetailModalOpen: (open: boolean) => void;
  selectedJob: Job | null;
}

export default function JobDetailModal({ detailModalOpen, setDetailModalOpen, selectedJob }: Props) {
  if (!detailModalOpen || !selectedJob) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Rincian Hasil Analisis Pekerjaan</span>
            <h3 className="text-lg font-bold text-white mt-0.5">Job: {selectedJob.jenis === "ingest_tarif" ? "Ingetsi Tarif RS" : "Verifikasi Klaim Pasien"}</h3>
          </div>
          <button type="button" onClick={() => setDetailModalOpen(false)} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition cursor-pointer">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="p-8 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
          {/* JOB METADATA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400 font-semibold uppercase">ID Pekerjaan</p>
              <p className="font-mono text-xs text-white font-bold">{selectedJob.job_id}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400 font-semibold uppercase">Waktu Pengiriman</p>
              <p className="text-xs text-white font-bold">{formatTanggal(selectedJob.tgl_dibuat)}</p>
            </div>
          </div>
          {/* JIKA JENIS: INGEST TARIF */}
          {selectedJob.jenis === "ingest_tarif" && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4 rounded-2xl">
                <h4 className="font-bold text-white flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5 text-emerald-400" /> Dokumen Tarif Sukses Di-ingest!</h4>
                <p className="text-xs text-slate-300 mt-2">Seluruh isi dokumen tarif RS berhasil diekstrak dan disimpan dalam format vektor untuk referensi pencocokan agen verifikasi di masa depan.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-bold uppercase block">ID Dokumen</span>
                  <span className="text-lg font-extrabold text-white mt-1 block">{selectedJob.dokumen_id}</span>
                </div>
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-bold uppercase block">Jumlah Chunks Vektor</span>
                  <span className="text-lg font-extrabold text-white mt-1 block">{selectedJob.jumlah_chunk}</span>
                </div>
              </div>
            </div>
          )}
          {/* JIKA JENIS: VERIFIKASI KLAIM */}
          {selectedJob.jenis === "verifikasi_klaim" && (
            <>
              {/* KEPUTUSAN UTAMA & CONFIDENCE SCORE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-2xl flex flex-col justify-center border ${getKeputusanStatusColor(selectedJob.keputusan?.status)}`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block font-semibold">Status Keputusan</span>
                  <span className="text-xl font-black mt-2 block">
                    {selectedJob.keputusan?.status || "TIDAK TERSEDIA"}
                  </span>
                </div>

                <div className="bg-slate-800/40 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-center">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block font-semibold">Confidence Score</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-white">{selectedJob.confidence_score}</span>
                    <span className="text-sm font-semibold text-slate-500">%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full mt-3 overflow-hidden border border-slate-800">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${selectedJob.confidence_score || 0}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-800/40 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-center">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block font-semibold">Item Tagihan (Laporan vs AI)</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-white">{selectedJob.jumlah_item}</span>
                    <span className="text-xs text-slate-400">/ {selectedJob.jumlah_item_diekstrak} diekstrak</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 mt-3 rounded-md w-fit ${selectedJob.jumlah_item === selectedJob.jumlah_item_diekstrak ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                    {selectedJob.jumlah_item === selectedJob.jumlah_item_diekstrak ? "Sesuai" : "Ada Perbedaan!"}
                  </span>
                </div>
              </div>

              {/* BANNER WARNING JIKA JUMLAH ITEM BEDA (CRITICAL REQUIREMENT) */}
              {selectedJob.jumlah_item !== selectedJob.jumlah_item_diekstrak && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-5 rounded-2xl flex gap-4 shadow-lg shadow-rose-950/10">
                  <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-white text-sm">Peringatan: Potensi Item Tagihan Hilang!</h4>
                    <p className="text-xs text-rose-400 mt-1 leading-relaxed">
                      Jumlah baris item tagihan di laporan akhir hasil verifikasi ({selectedJob.jumlah_item}) <strong>berbeda</strong> dengan jumlah item yang diekstrak oleh sistem agen ({selectedJob.jumlah_item_diekstrak}). Ada kemungkinan item hilang atau tidak terbaca saat analisis otomatis. <strong>Verifikator wajib memeriksa file laporan secara manual!</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* RINGKASAN FINANSIAL */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white border-l-2 border-indigo-500 pl-2.5">Ringkasan Keuangan Verifikasi</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Diajukan</span>
                    <span className="text-sm font-extrabold text-white mt-1 block">
                      {formatRupiah(selectedJob.keputusan?.total_diajukan)}
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Koreksi Tarif</span>
                    <span className="text-sm font-extrabold text-rose-400 mt-1 block">
                      {formatRupiah(selectedJob.keputusan?.koreksi_terverifikasi)}
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Perlu Klarifikasi</span>
                    <span className="text-sm font-extrabold text-amber-400 mt-1 block">
                      {formatRupiah(selectedJob.keputusan?.perlu_klarifikasi)}
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Rekomendasi Bayar</span>
                    <span className="text-sm font-extrabold text-emerald-400 mt-1 block">
                      {formatRupiah(selectedJob.keputusan?.rekomendasi_pembayaran)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
          {/* DAFTAR ALASAN / TEMUAN */}
          {selectedJob.jenis === "verifikasi_klaim" && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white border-l-2 border-indigo-500 pl-2.5">Alasan Keputusan & Temuan Analisis</h4>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5">
                  {selectedJob.keputusan?.alasan && selectedJob.keputusan.alasan.length > 0 ? (
                    <ul className="space-y-3">
                      {selectedJob.keputusan.alasan.map((reason, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-300">
                          <span className="h-5 w-5 rounded-full bg-slate-800 text-[10px] font-bold text-indigo-400 flex items-center justify-center shrink-0 border border-slate-700/80 mt-0.5">{idx + 1}</span>
                          <span className="leading-relaxed">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Tidak ada rincian alasan yang diberikan.</p>
                  )}
                </div>
              </div>

              {/* DOWNLOAD LAPORAN */}
              {selectedJob.files && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-white border-l-2 border-indigo-500 pl-2.5">Unduh Laporan Lengkap</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <a
                      href={`${API_BASE}/jobs/${selectedJob.job_id}/download/xlsx`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-white transition duration-150 text-center cursor-pointer font-semibold"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
                      Download Excel (.xlsx)
                    </a>

                    <a
                      href={`${API_BASE}/jobs/${selectedJob.job_id}/download/md`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-white transition duration-150 text-center cursor-pointer font-semibold"
                    >
                      <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                      Download Markdown (.md)
                    </a>

                    <a
                      href={`${API_BASE}/jobs/${selectedJob.job_id}/download/csv`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-white transition duration-150 text-center cursor-pointer font-semibold"
                    >
                      <FileCode className="h-4 w-4 text-blue-400 shrink-0" />
                      Download CSV (.csv)
                    </a>
                  </div>
                </div>
              )}

              {/* DISCLAIMER PENGGUNAAN SISTEM */}
              <div className="bg-slate-950 border border-indigo-500/20 p-5 rounded-2xl flex gap-3.5 shadow-xl shadow-slate-950/50">
                <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-extrabold text-xs text-white">Disclaimer Penggunaan Sistem</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    Sistem verifikasi otomatis ini adalah alat bantu penunjang keputusan (*decision-support tool*). Hasil analisis AI, perbandingan tarif, dan rekomendasi kepantasan medis yang disediakan wajib ditinjau, divalidasi, serta disahkan secara resmi oleh verifikator/tim medis manusia yang berwenang sebelum pembayaran klaim direalisasikan.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
        {/* FOOTER */}
        <div className="px-8 py-5 border-t border-slate-800 bg-slate-950/60 sticky bottom-0 flex items-center justify-end shrink-0">
          <button type="button" onClick={() => setDetailModalOpen(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-white cursor-pointer transition duration-150">
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
}
