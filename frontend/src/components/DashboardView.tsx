import React from "react";
import { Building2, UploadCloud, FileCheck, ArrowRight, RefreshCw } from "lucide-react";
import { RumahSakit, Job } from "../types";
import { formatTanggal, getStatusColor } from "../utils";

interface DashboardViewProps {
  rumahsakitList: RumahSakit[];
  jobsList: Job[];
  loadingRs: boolean;
  loadingJobs: boolean;
  fetchJobs: () => void;
  setActiveTab: (tab: "dashboard" | "rumahsakit" | "uploadtarif" | "verifikasiklaim" | "riwayat") => void;
  viewJobDetails: (job: Job) => void;
}

export default function DashboardView({
  rumahsakitList,
  jobsList,
  loadingRs,
  loadingJobs,
  fetchJobs,
  setActiveTab,
  viewJobDetails
}: DashboardViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition duration-200">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition duration-300">
            <Building2 className="h-32 w-32 text-white" />
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-indigo-400" />
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Rumah Sakit Terdaftar</p>
          <h3 className="text-3xl font-extrabold text-white mt-1">{loadingRs ? "..." : rumahsakitList.length}</h3>
          <button onClick={() => setActiveTab("rumahsakit")} className="mt-4 flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer">
            Kelola Rumah Sakit <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition duration-200">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition duration-300">
            <UploadCloud className="h-32 w-32 text-white" />
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <UploadCloud className="h-6 w-6 text-blue-400" />
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Ingest Dokumen Tarif</p>
          <h3 className="text-3xl font-extrabold text-white mt-1">
            {jobsList.filter(j => j.jenis === "ingest_tarif" && j.status === "done").length}
          </h3>
          <button onClick={() => setActiveTab("uploadtarif")} className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition cursor-pointer">
            Unggah Tarif Baru <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition duration-200">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition duration-300">
            <FileCheck className="h-32 w-32 text-white" />
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <FileCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Klaim Terverifikasi</p>
          <h3 className="text-3xl font-extrabold text-white mt-1">
            {jobsList.filter(j => j.jenis === "verifikasi_klaim" && j.status === "done").length}
          </h3>
          <button onClick={() => setActiveTab("verifikasiklaim")} className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer">
            Verifikasi Klaim PDF <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Job Terkini</h3>
              <p className="text-xs text-slate-400 mt-0.5">Status 5 pekerjaan terbaru di dalam sistem.</p>
            </div>
            <button type="button" onClick={fetchJobs} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white cursor-pointer transition">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-3 text-xs uppercase font-bold">Jenis Job</th>
                  <th className="pb-3 text-xs uppercase font-bold">Waktu</th>
                  <th className="pb-3 text-xs uppercase font-bold">Status</th>
                  <th className="pb-3 text-xs uppercase font-bold">Pesan Progress</th>
                  <th className="pb-3 text-xs uppercase font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loadingJobs ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500 font-medium">Memuat data...</td></tr>
                ) : jobsList.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500 font-medium">Belum ada riwayat pekerjaan.</td></tr>
                ) : (
                  jobsList.slice(0, 5).map((job) => (
                    <tr key={job.job_id} className="group hover:bg-slate-800/10">
                      <td className="py-3.5">
                        <span className="font-semibold text-white">
                          {job.jenis === "ingest_tarif" ? "Ingest Tarif" : "Verifikasi Klaim"}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400 text-xs">
                        {formatTanggal(job.tgl_dibuat)}
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-slate-300 max-w-xs truncate">
                        {job.pesan}
                      </td>
                      <td className="py-3.5 text-right">
                        {job.status === "done" ? (
                          <button
                            type="button"
                            onClick={() => viewJobDetails(job)}
                            className="px-2.5 py-1 bg-indigo-600/10 border border-indigo-500/20 rounded-lg text-xs font-bold text-indigo-400 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
                          >
                            Detail Hasil
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Panduan Alur Verifikasi</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-slate-800 text-xs font-bold text-indigo-400 flex items-center justify-center shrink-0 border border-slate-700">1</div>
              <div>
                <h4 className="text-xs font-bold text-white">Daftarkan RS</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Daftarkan data master RS terlebih dahulu melalui menu Kelola RS.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-slate-800 text-xs font-bold text-indigo-400 flex items-center justify-center shrink-0 border border-slate-700">2</div>
              <div>
                <h4 className="text-xs font-bold text-white">Upload Tarif Referensi</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Unggah berkas tarif resmi RS berformat PDF untuk disimpan dalam basis data vektor.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-slate-800 text-xs font-bold text-indigo-400 flex items-center justify-center shrink-0 border border-slate-700">3</div>
              <div>
                <h4 className="text-xs font-bold text-white">Verifikasi Klaim</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Kirim berkas klaim (bisa multi PDF). Sistem akan memproses dan membandingkan tarif otomatis.</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 mt-2">
            <p className="text-[10px] text-indigo-300 font-medium leading-relaxed">
              💡 <strong>Decision Support:</strong> Sistem ini menggunakan model AI Gemini dan Embedding vektor untuk merekomendasikan keputusan klaim. Keputusan akhir tetap wajib disahkan oleh verifikator manusia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
