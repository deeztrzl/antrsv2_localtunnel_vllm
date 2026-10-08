export const formatRupiah = (num: number | undefined) => {
  if (num === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(num);
};

export const formatTanggal = (isoStr: string | undefined) => {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return isoStr;
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "done": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "error": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    case "processing": return "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse";
    default: return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
  }
};

export const getKeputusanStatusColor = (status: string | undefined) => {
  if (!status) return "bg-slate-800 text-slate-400 border border-slate-700";
  const s = status.toUpperCase();
  if (s.includes("LAYAK") && !s.includes("TIDAK")) {
    return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
  } else if (s.includes("KLARIFIKASI")) {
    return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
  } else {
    return "bg-rose-500/10 text-rose-400 border border-rose-500/30";
  }
};
