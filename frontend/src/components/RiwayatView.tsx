import React from "react";
import { RefreshCw, UploadCloud, FileCheck } from "lucide-react";
import { Job } from "../types";
import { formatTanggal, getStatusColor } from "../utils";

interface Props {
  jobsList: Job[];
  loadingJobs: boolean;
  fetchJobs: () => void;
  viewJobDetails: (job: Job) => void;
}

export default function RiwayatView({
  jobsList, loadingJobs, fetchJobs, viewJobDetails
}: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Riwayat Pekerjaan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Daftar semua proses ingest tarif dan verifikasi klaim pasien di dalam sistem.</p>
        </div>
        <button type="button" onClick={fetchJobs} className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-2 text-xs font-bold">
          <RefreshCw className="h-4 w-4" /> Segarkan Riwayat
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium">
              <th className="pb-3 text-xs uppercase font-bold">Waktu Dibuat</th>
              <th className="pb-3 text-xs uppercase font-bold">ID Job</th>
              <th className="pb-3 text-xs uppercase font-bold">Jenis Pekerjaan</th>
              <th className="pb-3 text-xs uppercase font-bold">Status</th>
              <th className="pb-3 text-xs uppercase font-bold">Pesan Terakhir</th>
              <th className="pb-3 text-xs uppercase font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loadingJobs ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500 font-semibold">Memuat riwayat...</td></tr>
            ) : jobsList.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">Belum ada riwayat pekerjaan.</td></tr>
            ) : (
              jobsList.map((job) => (
                <tr key={job.job_id} className="hover:bg-slate-800/15">
                  <td className="py-4 text-xs font-medium text-slate-400">
                    {formatTanggal(job.tgl_dibuat)}
                  </td>
                  <td className="py-4 font-mono text-xs text-slate-300">
                    {job.job_id.slice(0, 18)}...
                  </td>
                  <td className="py-4 font-semibold text-white">
                    {job.jenis === "ingest_tarif" ? (
                      <span className="flex items-center gap-1.5 text-blue-400">
                        <UploadCloud className="h-4 w-4 shrink-0" /> Ingest Tarif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <FileCheck className="h-4 w-4 shrink-0" /> Verifikasi Klaim
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="py-4 text-xs text-slate-300 max-w-xs truncate">
                    {job.pesan}
                  </td>
                  <td className="py-4 text-right">
                    {job.status === "done" ? (
                      <button
                        type="button"
                        onClick={() => viewJobDetails(job)}
                        className="px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold text-indigo-400 transition cursor-pointer"
                      >
                        Lihat Detail
                      </button>
                    ) : (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
