# SpatialForge on RunPod (GPU backend)

Use this guide to run the **real TRELLIS.2** backend on a rented NVIDIA GPU while keeping the React app on your Mac.

```
Your Mac:  React @ http://127.0.0.1:5173
                │
                │  VITE_API_BASE_URL=https://<runpod-proxy-url>
                ▼
RunPod GPU: FastAPI + TRELLIS.2-4B  (TRELLIS_MOCK_MODE=false)
```

Estimated first session: **1–3 hours** (install + model download). Cost depends on GPU/hour — stop the pod when finished.

---

## 1. Create a RunPod account

1. Go to [https://www.runpod.io/](https://www.runpod.io/)
2. Sign up and add a payment method / credits
3. Open **Pods** → **Deploy**

---

## 2. Pick the right GPU

Official TRELLIS.2 needs **≥ 24 GB VRAM**. Prefer more headroom.

| Priority | GPU | Why |
|----------|-----|-----|
| Best value for PoC | **RTX 5090 32GB** or **L40S 48GB** | Enough VRAM, usually cheaper than H100 |
| Safe / official | **A100 40GB or 80GB** | Matches Microsoft’s tested class |
| Avoid for v1 | Cards with **&lt; 24 GB** | Likely CUDA OOM |

Also set:

- **Container disk:** at least **60–80 GB** (model ~16 GB + deps + room)
- **Volume disk (optional):** 50+ GB persistent volume if you want weights to survive pod stops
- **Template:** **RunPod Pytorch** or **Ubuntu + CUDA** (not a tiny Jupyter-only image without build tools)
- **Expose HTTP ports:** `8000` (SpatialForge API). Optionally `8888` if you use Jupyter.

Enable a **public HTTP proxy / TCP port** for `8000` so your Mac can reach the API.

---

## 3. Deploy the pod

1. Click **Deploy**
2. Wait until status is **Running**
3. Open **Connect** → **SSH** or **Web terminal**
4. Copy the **public URL** for port `8000` (RunPod proxy URL). You’ll need it for the frontend.

Example proxy form (exact UI varies):

```text
https://<pod-id>-8000.proxy.runpod.net
```

---

## 4. First boot checklist (inside the pod)

Paste this in the pod terminal:

```bash
# System sanity
nvidia-smi
uname -a
df -h
python3 --version || true
```

You should see your GPU listed in `nvidia-smi`.

---

## 5. Clone SpatialForge + TRELLIS.2

```bash
cd /workspace
# SpatialForge — replace with your Git URL, or upload via SCP
git clone <YOUR_SPATIALFORGE_REPO_URL> spatialforge
# Or if you uploaded a zip:
# unzip spatialforge.zip -d /workspace/spatialforge

git clone -b main https://github.com/microsoft/TRELLIS.2.git --recursive
cd TRELLIS.2
```

If you don’t have a remote Git repo yet, from your Mac:

```bash
# Example: copy project to the pod (replace host/user from RunPod SSH panel)
scp -r /Users/deionstfleur/threplica root@<RUNPOD_SSH_HOST>:/workspace/spatialforge
```

---

## 6. Install TRELLIS.2 (official)

```bash
cd /workspace/TRELLIS.2

# If CUDA toolkit path exists:
export CUDA_HOME=/usr/local/cuda-12.4
# or:
# export CUDA_HOME=/usr/local/cuda

. ./setup.sh --new-env --basic --flash-attn --nvdiffrast --nvdiffrec --cumesh --o-voxel --flexgemm
```

This can take a long time. If `flash-attn` fails on your GPU, install `xformers` and later set:

```bash
export ATTN_BACKEND=xformers
```

Activate the env:

```bash
conda activate trellis2
```

---

## 7. Download model weights

Weights come from Hugging Face: `microsoft/TRELLIS.2-4B` (~16 GB).

```bash
conda activate trellis2
pip install -U "huggingface_hub[cli]"

# Optional if the model gate / rate limits require login:
# huggingface-cli login

python - <<'PY'
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id="microsoft/TRELLIS.2-4B",
    local_dir=None,  # uses HF cache
)
print("Download complete (or already cached).")
PY
```

Or let the pipeline download on first `from_pretrained(...)` call.

---

## 8. Prove TRELLIS works (before FastAPI)

```bash
conda activate trellis2
cd /workspace/TRELLIS.2
python example.py
```

Or use SpatialForge’s standalone script once Phase 6 is wired:

```bash
cd /workspace/spatialforge/backend
python scripts/test_trellis.py \
  --input /workspace/spatialforge/backend/storage/uploads/test-chair.png \
  --output /workspace/spatialforge/backend/storage/models/test-chair.glb \
  --seed 42 \
  --quality preview
```

Success = a real `.glb` that opens in the browser viewer (not the avocado sample).

---

## 9. Run SpatialForge API on the pod

```bash
conda activate trellis2
cd /workspace/spatialforge/backend

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
```

Edit `.env`:

```env
APP_ENV=production
FRONTEND_ORIGIN=http://127.0.0.1:5173
FRONTEND_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
PUBLIC_BASE_URL=https://<YOUR_POD_ID>-8000.proxy.runpod.net
STORAGE_ROOT=./storage
MAX_UPLOAD_MB=10
TRELLIS_MOCK_MODE=false
TRELLIS_REPO_PATH=/workspace/TRELLIS.2
TRELLIS_MODEL_ID=microsoft/TRELLIS.2-4B
HF_TOKEN=
```

Start the API:

```bash
export PYTHONPATH=/workspace/TRELLIS.2:${PYTHONPATH}
export OPENCV_IO_ENABLE_OPENEXR=1
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True

uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Check:

```bash
curl https://<YOUR_POD_ID>-8000.proxy.runpod.net/api/health
```

Expect something like:

```json
{"status":"ok","gpu_available":true,"model_loaded":true,"active_job":false}
```

> Until Phase 7 is finished, `TRELLIS_MOCK_MODE=false` will not fully generate yet — complete the standalone TRELLIS test first, then we wire FastAPI to the real pipeline.

---

## 10. Point your Mac frontend at RunPod

On your Mac, edit `frontend/.env`:

```env
VITE_API_BASE_URL=https://<YOUR_POD_ID>-8000.proxy.runpod.net
```

Restart Vite:

```bash
cd frontend
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). The header should show **Generator ready** when the pod API is reachable.

---

## 11. Cost control (important)

- **Stop / terminate** the pod when you’re done testing
- Prefer a **network volume** for HF cache if you restart often (avoids re-downloading 16 GB)
- Use **Preview** quality first to reduce VRAM pressure
- Don’t leave an idle H100 running overnight

---

## 12. Troubleshooting

| Problem | What to try |
|---------|-------------|
| `nvidia-smi` missing | Wrong template / no GPU attached |
| CUDA OOM | Use Preview quality; pick a larger GPU; set `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True` |
| CORS errors in browser | Add your Vite origin to `FRONTEND_ORIGINS`; set `PUBLIC_BASE_URL` to the RunPod HTTPS proxy |
| Health unreachable | Confirm port `8000` is exposed; use the proxy URL, not the internal pod IP |
| Install script fails | Install flags one at a time; try `ATTN_BACKEND=xformers` |
| Still get avocado | `TRELLIS_MOCK_MODE` is still `true`, or Phase 7 not wired yet |

---

## Recommended first session order

1. Deploy **L40S / 5090 / A100** pod with big disk  
2. `nvidia-smi` OK  
3. Install TRELLIS.2  
4. Run `example.py` → real GLB  
5. Message here with the pod proxy URL — we’ll finish Phase 6–7 wiring against that machine  

You do **not** need a home Linux PC. RunPod *is* the Linux NVIDIA GPU machine.
