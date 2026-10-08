import React from "react";
import { FileCheck, Activity, Building2, UploadCloud, History, RefreshCw } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: "dashboard" | "rumahsakit" | "uploadtarif" | "verifikasiklaim" | "riwayat") => void;
  apiConnected: boolean | null;
  checkApiHealth: () => void;
  fetchJobs: () => void;
  fetchRumahSakit: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  apiConnected,
  checkApiHealth,
  fetchJobs,
  fetchRumahSakit
}: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-10 shrink-0">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <FileCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white leading-tight">ANTRS 2.0</h1>
          <p className="text-[10px] text-slate-400 font-medium">BPJS Ketenagakerjaan</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <button
          onClick={() => { setActiveTab("dashboard"); fetchJobs(); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
              : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
          }`}
        >
          <Activity className="h-4 w-4" />
          Dashboard
        </button>

        <button
          onClick={() => { setActiveTab("rumahsakit"); fetchRumahSakit(); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "rumahsakit"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
              : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Manajemen RS
        </button>

        <button
          onClick={() => { setActiveTab("uploadtarif"); fetchRumahSakit(); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "uploadtarif"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
              : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          Upload Tarif RS
        </button>

        <button
          onClick={() => { setActiveTab("verifikasiklaim"); fetchRumahSakit(); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "verifikasiklaim"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
              : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
          }`}
        >
          <FileCheck className="h-4 w-4" />
          Verifikasi Klaim
        </button>

        <button
          onClick={() => { setActiveTab("riwayat"); fetchJobs(); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === "riwayat"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
              : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
          }`}
        >
          <History className="h-4 w-4" />
          Riwayat Job
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/60 text-center">
        <div className="flex items-center justify-center gap-2 text-xs">
          <span className={`h-2 w-2 rounded-full ${apiConnected ? "bg-emerald-500 animate-pulse" : apiConnected === false ? "bg-rose-500" : "bg-slate-600"}`} />
          <span className="font-semibold text-slate-400">
            API {apiConnected ? "Terhubung" : apiConnected === false ? "Terputus" : "Memeriksa..."}
          </span>
          <button onClick={checkApiHealth} className="hover:text-white text-slate-500 cursor-pointer transition">
            <RefreshCw className="h-3 w-3 hover:rotate-180 transition duration-300" />
          </button>
        </div>
      </div>
    </aside>
  );
}
