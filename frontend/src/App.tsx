import { useState, useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { RumahSakit, Job } from "./types";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import RumahSakitView from "./components/RumahSakitView";
import UploadTarifView from "./components/UploadTarifView";
import VerifikasiKlaimView from "./components/VerifikasiKlaimView";
import RiwayatView from "./components/RiwayatView";
import JobDetailModal from "./components/JobDetailModal";

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "rumahsakit" | "uploadtarif" | "verifikasiklaim" | "riwayat">("dashboard");
  const [rumahsakitList, setRumahsakitList] = useState<RumahSakit[]>([]);
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const [loadingRs, setLoadingRs] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activePollJobId, setActivePollJobId] = useState<string | null>(null);
  const [activePollType, setActivePollType] = useState<"tarif" | "klaim" | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // RS Form
  const [rsKode, setRsKode] = useState("");
  const [rsNama, setRsNama] = useState("");
  const [rsAlamat, setRsAlamat] = useState("");
  const [rsSubmitting, setRsSubmitting] = useState(false);
  const [rsError, setRsError] = useState("");
  const [rsSuccess, setRsSuccess] = useState(false);

  // Tarif Form
  const [tarifRs, setTarifRs] = useState("");
  const [tarifNamaDokumen, setTarifNamaDokumen] = useState("");
  const [tarifTglAwal, setTarifTglAwal] = useState("");
  const [tarifTglAkhir, setTarifTglAkhir] = useState("");
  const [tarifFile, setTarifFile] = useState<File | null>(null);
  const [tarifError, setTarifError] = useState("");
  const [tarifSuccessJobId, setTarifSuccessJobId] = useState<string | null>(null);
  const [tarifSubmitting, setTarifSubmitting] = useState(false);

  // Klaim Form
  const [klaimRs, setKlaimRs] = useState("");
  const [klaimFiles, setKlaimFiles] = useState<File[]>([]);
  const [klaimError, setKlaimError] = useState("");
  const [klaimSuccessJobId, setKlaimSuccessJobId] = useState<string | null>(null);
  const [klaimSubmitting, setKlaimSubmitting] = useState(false);

  useEffect(() => { checkApiHealth(); fetchRumahSakit(); fetchJobs(); }, []);

  useEffect(() => {
    if (activePollJobId) {
      pollIntervalRef.current = setInterval(() => { pollJobStatus(activePollJobId); }, 2500);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [activePollJobId]);

  const checkApiHealth = async () => {
    try { const r = await fetch(`${API_BASE}/health`); setApiConnected(r.ok); } catch { setApiConnected(false); }
  };

  const fetchRumahSakit = async () => {
    setLoadingRs(true);
    try {
      const r = await fetch(`${API_BASE}/rumah-sakit`);
      if (r.ok) setRumahsakitList(await r.json());
    } catch (e) { console.error(e); } finally { setLoadingRs(false); }
  };

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const r = await fetch(`${API_BASE}/jobs`);
      if (r.ok) setJobsList(await r.json());
    } catch (e) { console.error(e); } finally { setLoadingJobs(false); }
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      const r = await fetch(`${API_BASE}/jobs/${jobId}`); if (!r.ok) return;
      const job: Job = await r.json();
      setJobsList(prev => prev.map(j => j.job_id === jobId ? { ...j, ...job } : j));

      if (activePollType === "tarif" && tarifSuccessJobId === jobId) {
        if (job.status === "done" || job.status === "error") { setActivePollJobId(null); fetchJobs(); }
      } else if (activePollType === "klaim" && klaimSuccessJobId === jobId) {
        if (job.status === "done" || job.status === "error") {
          setActivePollJobId(null); fetchJobs();
          if (job.status === "done") setSelectedJob(job);
        }
      }
      if (selectedJob && selectedJob.job_id === jobId) setSelectedJob(job);
    } catch (e) { console.error(e); }
  };

  const handleAddRs = async (e: React.FormEvent) => {
    e.preventDefault(); setRsError(""); setRsSuccess(false);
    if (!rsKode.trim() || !rsNama.trim()) return setRsError("Kode RS dan Nama RS wajib diisi.");
    setRsSubmitting(true);
    const fd = new FormData(); fd.append("kode", rsKode.trim()); fd.append("nama_rs", rsNama.trim()); fd.append("alamat", rsAlamat.trim());
    try {
      const r = await fetch(`${API_BASE}/rumah-sakit`, { method: "POST", body: fd });
      if (r.ok) {
        setRsSuccess(true); setRsKode(""); setRsNama(""); setRsAlamat(""); fetchRumahSakit();
      } else { const err = await r.json(); setRsError(err.detail || "Gagal."); }
    } catch { setRsError("Koneksi gagal."); } finally { setRsSubmitting(false); }
  };

  const handleUploadTarif = async (e: React.FormEvent) => {
    e.preventDefault(); setTarifError(""); setTarifSuccessJobId(null);
    if (!tarifRs || !tarifNamaDokumen.trim() || !tarifTglAwal || !tarifFile) return setTarifError("Lengkapi semua bidang.");
    setTarifSubmitting(true);
    const fd = new FormData(); fd.append("file", tarifFile); fd.append("kode_rs", tarifRs); fd.append("nama_dokumen", tarifNamaDokumen); fd.append("tgl_berlaku_awal", tarifTglAwal);
    if (tarifTglAkhir) fd.append("tgl_berlaku_akhir", tarifTglAkhir);
    try {
      const r = await fetch(`${API_BASE}/tarif/upload`, { method: "POST", body: fd });
      if (r.ok) {
        const d = await r.json(); setTarifSuccessJobId(d.job_id); setActivePollType("tarif"); setActivePollJobId(d.job_id);
        const n: Job = { job_id: d.job_id, status: "pending", jenis: "ingest_tarif", pesan: "Menunggu...", tgl_dibuat: new Date().toISOString() };
        setJobsList(p => [n, ...p]); setTarifNamaDokumen(""); setTarifTglAwal(""); setTarifTglAkhir(""); setTarifFile(null);
      } else { const err = await r.json(); setTarifError(err.detail || "Gagal."); }
    } catch { setTarifError("Koneksi ditolak."); } finally { setTarifSubmitting(false); }
  };

  const handleUploadKlaim = async (e: React.FormEvent) => {
    e.preventDefault(); setKlaimError(""); setKlaimSuccessJobId(null);
    if (!klaimRs || klaimFiles.length === 0) return setKlaimError("Pilih RS dan File.");
    setKlaimSubmitting(true);
    const fd = new FormData(); fd.append("kode_rs", klaimRs);
    for (const f of klaimFiles) fd.append("files", f);
    try {
      const r = await fetch(`${API_BASE}/klaim/verifikasi`, { method: "POST", body: fd });
      if (r.ok) {
        const d = await r.json(); setKlaimSuccessJobId(d.job_id); setActivePollType("klaim"); setActivePollJobId(d.job_id);
        const n: Job = { job_id: d.job_id, status: "pending", jenis: "verifikasi_klaim", pesan: "Menunggu...", tgl_dibuat: new Date().toISOString() };
        setJobsList(p => [n, ...p]); setKlaimFiles([]);
      } else { const err = await r.json(); setKlaimError(err.detail || "Gagal."); }
    } catch { setKlaimError("Koneksi gagal."); } finally { setKlaimSubmitting(false); }
  };

  const viewJobDetails = (job: Job) => { setSelectedJob(job); setDetailModalOpen(true); };
  const activeJobStatusDetail = jobsList.find(j => j.job_id === (tarifSuccessJobId || klaimSuccessJobId));

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} apiConnected={apiConnected} checkApiHealth={checkApiHealth} fetchJobs={fetchJobs} fetchRumahSakit={fetchRumahSakit} />
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        <Header activeTab={activeTab} />
        <div className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto space-y-6">
          {apiConnected === false && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-rose-950/20">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <div>
                <h4 className="font-bold text-white leading-tight">API Terputus</h4>
                <p className="text-xs text-rose-400 mt-1">Gagal terhubung dengan server API di {API_BASE}.</p>
              </div>
            </div>
          )}
          {activeTab === "dashboard" && <DashboardView rumahsakitList={rumahsakitList} jobsList={jobsList} loadingRs={loadingRs} loadingJobs={loadingJobs} fetchJobs={fetchJobs} setActiveTab={setActiveTab} viewJobDetails={viewJobDetails} />}
          {activeTab === "rumahsakit" && <RumahSakitView rumahsakitList={rumahsakitList} loadingRs={loadingRs} fetchRumahSakit={fetchRumahSakit} rsKode={rsKode} setRsKode={setRsKode} rsNama={rsNama} setRsNama={setRsNama} rsAlamat={rsAlamat} setRsAlamat={setRsAlamat} rsSubmitting={rsSubmitting} rsError={rsError} rsSuccess={rsSuccess} handleAddRs={handleAddRs} />}
          {activeTab === "uploadtarif" && <UploadTarifView rumahsakitList={rumahsakitList} tarifRs={tarifRs} setTarifRs={setTarifRs} tarifNamaDokumen={tarifNamaDokumen} setTarifNamaDokumen={setTarifNamaDokumen} tarifTglAwal={tarifTglAwal} setTarifTglAwal={setTarifTglAwal} tarifTglAkhir={tarifTglAkhir} setTarifTglAkhir={setTarifTglAkhir} tarifFile={tarifFile} setTarifFile={setTarifFile} tarifError={tarifError} tarifSuccessJobId={tarifSuccessJobId} tarifSubmitting={tarifSubmitting} handleUploadTarif={handleUploadTarif} activeJobStatusDetail={activeJobStatusDetail} />}
          {activeTab === "verifikasiklaim" && <VerifikasiKlaimView rumahsakitList={rumahsakitList} klaimRs={klaimRs} setKlaimRs={setKlaimRs} klaimFiles={klaimFiles} setKlaimFiles={setKlaimFiles} klaimError={klaimError} klaimSuccessJobId={klaimSuccessJobId} klaimSubmitting={klaimSubmitting} handleUploadKlaim={handleUploadKlaim} activeJobStatusDetail={activeJobStatusDetail} viewJobDetails={viewJobDetails} />}
          {activeTab === "riwayat" && <RiwayatView jobsList={jobsList} loadingJobs={loadingJobs} fetchJobs={fetchJobs} viewJobDetails={viewJobDetails} />}
        </div>
      </main>
      <JobDetailModal detailModalOpen={detailModalOpen} setDetailModalOpen={setDetailModalOpen} selectedJob={selectedJob} />
    </div>
  );
}
