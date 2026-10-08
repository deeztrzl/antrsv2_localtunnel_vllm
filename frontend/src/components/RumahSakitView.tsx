import React from "react";
import { AlertCircle, Check, Plus, RefreshCw } from "lucide-react";
import { RumahSakit } from "../types";

interface Props {
  rumahsakitList: RumahSakit[];
  loadingRs: boolean;
  fetchRumahSakit: () => void;
  rsKode: string;
  setRsKode: (val: string) => void;
  rsNama: string;
  setRsNama: (val: string) => void;
  rsAlamat: string;
  setRsAlamat: (val: string) => void;
  rsSubmitting: boolean;
  rsError: string;
  rsSuccess: boolean;
  handleAddRs: (e: React.FormEvent) => void;
}

export default function RumahSakitView({
  rumahsakitList, loadingRs, fetchRumahSakit, rsKode, setRsKode, rsNama, setRsNama, rsAlamat, setRsAlamat, rsSubmitting, rsError, rsSuccess, handleAddRs
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Pendaftaran RS</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tambah RS baru.</p>
        </div>
        <form onSubmit={handleAddRs} className="space-y-4">
          {rsError && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2"><AlertCircle className="h-4 w-4" />{rsError}</div>}
          {rsSuccess && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2"><Check className="h-4 w-4" />RS terdaftar!</div>}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Kode RS (Unique)</label>
            <input type="text" placeholder="Contoh: RS001" value={rsKode} onChange={e => setRsKode(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none" disabled={rsSubmitting} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Nama Rumah Sakit</label>
            <input type="text" placeholder="RS Pelni" value={rsNama} onChange={e => setRsNama(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none" disabled={rsSubmitting} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Alamat</label>
            <textarea placeholder="Alamat..." value={rsAlamat} onChange={e => setRsAlamat(e.target.value)} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none resize-none" disabled={rsSubmitting} />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer" disabled={rsSubmitting}>
            {rsSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {rsSubmitting ? "Memproses..." : "Daftarkan RS"}
          </button>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Daftar Rumah Sakit</h3>
            <p className="text-xs text-slate-400 mt-0.5">Institusi RS pembanding.</p>
          </div>
          <button type="button" onClick={fetchRumahSakit} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white cursor-pointer"><RefreshCw className="h-4 w-4" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="pb-3 text-xs uppercase font-bold w-24">Kode</th>
                <th className="pb-3 text-xs uppercase font-bold">Nama RS</th>
                <th className="pb-3 text-xs uppercase font-bold">Alamat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loadingRs ? (
                <tr><td colSpan={3} className="py-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : rumahsakitList.length === 0 ? (
                <tr><td colSpan={3} className="py-8 text-center text-slate-500">Belum ada RS.</td></tr>
              ) : (
                rumahsakitList.map(rs => (
                  <tr key={rs.id} className="hover:bg-slate-800/10">
                    <td className="py-3.5"><span className="font-mono font-bold text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-lg text-xs">{rs.kode}</span></td>
                    <td className="py-3.5 font-semibold text-white">{rs.nama_rs}</td>
                    <td className="py-3.5 text-slate-400 text-xs max-w-xs truncate">{rs.alamat || <span className="text-slate-600 italic">Tidak ada alamat</span>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
