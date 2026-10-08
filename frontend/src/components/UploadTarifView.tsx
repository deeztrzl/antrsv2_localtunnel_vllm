import React from "react";
import { AlertCircle, UploadCloud, RefreshCw, ChevronRight, CheckCircle2, XCircle, Info } from "lucide-react";
import { RumahSakit, Job } from "../types";
import { getStatusColor } from "../utils";

interface Props {
  rumahsakitList: RumahSakit[];
  tarifRs: string;
  setTarifRs: (val: string) => void;
  tarifNamaDokumen: string;
  setTarifNamaDokumen: (val: string) => void;
  tarifTglAwal: string;
  setTarifTglAwal: (val: string) => void;
  tarifTglAkhir: string;
  setTarifTglAkhir: (val: string) => void;
  tarifFile: File | null;
  setTarifFile: (file: File | null) => void;
  tarifError: string;
  tarifSuccessJobId: string | null;
  tarifSubmitting: boolean;
  handleUploadTarif: (e: React.FormEvent) => void;
  activeJobStatusDetail?: Job;
}

export default function UploadTarifView({
  rumahsakitList, tarifRs, setTarifRs, tarifNamaDokumen, setTarifNamaDokumen, tarifTglAwal, setTarifTglAwal, tarifTglAkhir, setTarifTglAkhir,
  tarifFile, setTarifFile, tarifError, tarifSuccessJobId, tarifSubmitting, handleUploadTarif, activeJobStatusDetail
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Unggah Tarif RS</h3>
          <p className="text-xs text-slate-400 mt-0.5">Kirim dokumen PDF tarif RS untuk di-ingest ke database vektor.</p>
        </div>

        <form onSubmit={handleUploadTarif} className="space-y-4">
          {tarifError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{tarifError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Rumah Sakit</label>
              <select value={tarifRs} onChange={e => setTarifRs(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none" disabled={tarifSubmitting}>
                <option value="">-- Pilih Rumah Sakit --</option>
                {rumahsakitList.map(rs => <option key={rs.kode} value={rs.kode}>{rs.nama_rs} ({rs.kode})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Nama Dokumen</label>
              <input type="text" placeholder="Tarif Rawat Jalan 2026" value={tarifNamaDokumen} onChange={e => setTarifNamaDokumen(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none" disabled={tarifSubmitting} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Mulai Berlaku</label>
              <input type="date" value={tarifTglAwal} onChange={e => setTarifTglAwal(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none" disabled={tarifSubmitting} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Akhir Berlaku (Opsional)</label>
              <input type="date" value={tarifTglAkhir} onChange={e => setTarifTglAkhir(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none" disabled={tarifSubmitting} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">File PDF Tarif</label>
            <div className="border-2 border-dashed border-slate-800 bg-slate-950/40 rounded-2xl p-6 text-center">
              <input type="file" id="file-tarif-input" accept="application/pdf" onChange={e => setTarifFile(e.target.files ? e.target.files[0] : null)} className="hidden" disabled={tarifSubmitting} />
              <label htmlFor="file-tarif-input" className="cursor-pointer block space-y-2">
                <UploadCloud className="h-10 w-10 text-slate-500 mx-auto" />
                <span className="text-sm font-semibold text-slate-300 block">{tarifFile ? tarifFile.name : "Pilih berkas PDF..."}</span>
                <span className="text-xs text-slate-500 block">PDF Maks. 50MB</span>
              </label>
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer" disabled={tarifSubmitting}>
            {tarifSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {tarifSubmitting ? "Mengunggah..." : "Proses Ingest Tarif"}
          </button>
        </form>
      </div>
      {/* PANEL MONITOR STATUS JOB AKTIF */}
      <div className="space-y-6">
        {tarifSuccessJobId && activeJobStatusDetail && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <RefreshCw className={`h-5 w-5 text-indigo-400 ${activeJobStatusDetail.status === "processing" ? "animate-spin" : ""}`} />
              <div>
                <h4 className="text-sm font-bold text-white">Status Ingest Live</h4>
                <p className="text-[10px] text-slate-400">ID: {activeJobStatusDetail.job_id.slice(0, 8)}...</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusColor(activeJobStatusDetail.status)}`}>{activeJobStatusDetail.status}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono flex items-center gap-2 text-indigo-300">
                <ChevronRight className="h-3 w-3 animate-pulse" />
                <span className="font-bold">{activeJobStatusDetail.pesan}</span>
              </div>
            </div>
            {activeJobStatusDetail.status === "done" && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl text-xs text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1 text-white"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Selesai!</p>
                <p>Dokumen berhasil diproses:</p>
                <ul className="list-disc pl-4 font-semibold text-slate-300 mt-1">
                  <li>ID Dokumen: {activeJobStatusDetail.dokumen_id}</li>
                  <li>Jumlah Chunk Vektor: {activeJobStatusDetail.jumlah_chunk}</li>
                </ul>
              </div>
            )}
            {activeJobStatusDetail.status === "error" && (
              <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl text-xs text-rose-300">
                <p className="font-bold flex items-center gap-1 text-white"><XCircle className="h-4 w-4 text-rose-400" /> Gagal</p>
                <p className="mt-1 font-mono">{activeJobStatusDetail.pesan}</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-white">Mengapa Ingest Tarif?</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sistem verifikasi klaim membandingkan tarif yang ditagihkan dengan **Tarif Referensi RS** yang valid. Proses ini mencari item tagihan klaim menggunakan *similarity search* pada basis data vektor tarif RS.
          </p>
          <div className="text-xs text-indigo-300 font-semibold flex items-center gap-1"><Info className="h-4 w-4" /> PDF harus berbasis teks.</div>
        </div>
      </div>
    </div>
  );
}
