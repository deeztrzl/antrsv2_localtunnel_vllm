import React from "react";

interface HeaderProps {
  activeTab: string;
}

export default function Header({ activeTab }: HeaderProps) {
  const getTabTitle = (tab: string) => {
    return tab
      .replace("rumahsakit", "Manajemen RS")
      .replace("uploadtarif", "Upload Tarif RS")
      .replace("verifikasiklaim", "Verifikasi Klaim")
      .replace("riwayat", "Riwayat Pekerjaan");
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-white capitalize">{getTabTitle(activeTab)}</h2>
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-400">
        <span className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 font-medium text-slate-300">
          {new Date().toLocaleDateString("id-ID", {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </span>
      </div>
    </header>
  );
}
