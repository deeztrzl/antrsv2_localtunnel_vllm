import React from "react";
import { AlertCircle, UploadCloud, RefreshCw, ChevronRight, CheckCircle2, XCircle, Info, FileCheck, AlertTriangle } from "lucide-react";
import { RumahSakit, Job } from "../types";
import { getStatusColor, getKeputusanStatusColor } from "../utils";

interface Props {
  rumahsakitList: RumahSakit[];
  klaimRs: string;
  setKlaimRs: (val: string) => void;
  klaimFiles: File[];
  setKlaimFiles: (files: File[]) => void;
  klaimError: string;
  klaimSuccessJobId: string | null;
  klaimSubmitting: boolean;
  handleUploadKlaim: (e: React.FormEvent) => void;
  activeJobStatusDetail?: Job;
  viewJobDetails: (job: Job) => void;
}

export default function VerifikasiKlaimView({
  rumahsakitList, klaimRs, setKlaimRs, klaimFiles, setKlaimFiles, klaimError, klaimSuccessJobId, klaimSubmitting, handleUploadKlaim,
  activeJobStatusDetail, viewJobDetails
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      {/* FORM KLAIM */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Kirim Verifikasi Klaim</h3>
          <p className="text-xs text-slate-400 mt-0.5">Unggah berkas tagihan & rekam medis pasien untuk dianalisis oleh AI agen verifikator.</p>
        </div>

        <form onSubmit={handleUploadKlaim} className="space-y-4">
          {klaimError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{klaimError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Pilih Rumah Sakit</label>
            <select
              value={klaimRs}
              onChange={(e) => setKlaimRs(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              disabled={klaimSubmitting}
            >
              <option value="">-- Pilih Rumah Sakit --</option>
              {rumahsakitList.map(rs => (
                <option key={rs.kode} value={rs.kode}>{rs.nama_rs} ({rs.kode})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Dokumen Klaim Pasien (Bisa Multi File)</label>
            <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-2xl p-6 text-center">
              <input
                type="file"
                id="files-klaim-input"
                accept="application/pdf"
                multiple
                onChange={(e) => setKlaimFiles(e.target.files ? Array.from(e.target.files) : [])}
                className="hidden"
                disabled={klaimSubmitting}
              />
              <label htmlFor="files-klaim-input" className="cursor-pointer block space-y-2">
                <UploadCloud className="h-10 w-10 text-slate-500 mx-auto" />
                <span className="text-sm font-semibold text-slate-300 block">
                  {klaimFiles.length > 0 ? `${klaimFiles.length} file dipilih` : "Pilih file-file PDF klaim..."}
                </span>
                <span className="text-xs text-slate-500 block">Kombinasikan PDF Billing, Resume Medis, dan Dokumen PLKK</span>
              </label>
            </div>

            {klaimFiles.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5 text-xs text-slate-400">
                {klaimFiles.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between font-medium">
                    <span className="truncate max-w-md">{f.name}</span>
                    <span className="font-bold text-indigo-400 shrink-0">{(f.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 transition duration-150 cursor-pointer"
            disabled={klaimSubmitting}
          >
            {klaimSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Mengunggah & Memproses...
              </>
            ) : (
              <>
                <FileCheck className="h-4 w-4" /> Mulai Analisis Verifikasi
              </>
            )}
          </button>
        </form>
      </div>
      {/* PANEL LIVE MONITOR KLAIM */}
      <div className="space-y-6">
        {klaimSuccessJobId && activeJobStatusDetail && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <RefreshCw className={`h-5 w-5 text-emerald-400 ${activeJobStatusDetail.status === "processing" ? "animate-spin" : ""}`} />
              <div>
                <h4 className="text-sm font-bold text-white">Status Live Verifikasi</h4>
                <p className="text-[10px] text-slate-400">ID: {activeJobStatusDetail.job_id.slice(0, 8)}...</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Status Pekerjaan:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusColor(activeJobStatusDetail.status)}`}>
                  {activeJobStatusDetail.status}
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono flex items-center gap-2 text-emerald-300">
                <ChevronRight className="h-3 w-3 animate-pulse" />
                <span className="font-bold">{activeJobStatusDetail.pesan}</span>
              </div>
            </div>

            {activeJobStatusDetail.status === "done" && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl text-xs space-y-1.5 text-slate-300">
                <p className="font-bold flex items-center gap-1.5 text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Analisis Selesai!
                </p>
                <div className={`p-2 rounded-lg font-bold text-xs inline-block ${getKeputusanStatusColor(activeJobStatusDetail.keputusan?.status)}`}>
                  Keputusan: {activeJobStatusDetail.keputusan?.status}
                </div>
                <button
                  type="button"
                  onClick={() => viewJobDetails(activeJobStatusDetail)}
                  className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition duration-150 cursor-pointer text-center block animate-bounce"
                >
                  Lihat Detail Hasil Analisis
                </button>
              </div>
            )}

            {activeJobStatusDetail.status === "error" && (
              <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl text-xs space-y-1 text-rose-300">
                <p className="font-bold flex items-center gap-1.5 text-white">
                  <XCircle className="h-4 w-4 text-rose-400 shrink-0" /> Gagal Analisis
                </p>
                <p className="mt-1 font-mono text-slate-400">{activeJobStatusDetail.pesan}</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-white">Proses Analisis Agen AI</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Model akan mengekstrak tagihan secara granular, membandingkannya dengan database tarif referensi, serta memverifikasi resume medis secara otomatis.
          </p>
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-[11px] font-semibold text-slate-400 flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-amber-400"><AlertTriangle className="h-4 w-4" /> Rekomendasi Finansial:</span>
            <span>AI akan menghasilkan file laporan terstruktur (.md, .xlsx, .csv) yang siap diunduh.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
