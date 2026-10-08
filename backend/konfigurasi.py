import os
from pathlib import Path

# Base directory: /backend
BASE_DIR = Path(__file__).resolve().parent

# Data directory: default di /data (di luar /backend)
DATA_DIR = Path(os.getenv("DATA_DIR", BASE_DIR.parent / "data"))

# Sub-direktori data
DIR_LAPORAN = DATA_DIR / "laporan_klaim"
DIR_OUTPUT_DEBUG = DATA_DIR / "output_debug"
DIR_UPLOADS = DATA_DIR / "uploads"

# Auto-create direktori saat modul dipanggil/dipakai
DIR_LAPORAN.mkdir(parents=True, exist_ok=True)
DIR_OUTPUT_DEBUG.mkdir(parents=True, exist_ok=True)
DIR_UPLOADS.mkdir(parents=True, exist_ok=True)

# Path System Prompt
PATH_SYSTEM_PROMPT = BASE_DIR / "prompt" / "system_prompt_verifikator.md"

# Nama Model (Konstanta)
EMBEDDING_MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIM = 384

MODEL_EKSTRAKSI = "gemini-3.1-flash-lite"
MODEL_ANALISIS = "gemini-3-flash-preview"
