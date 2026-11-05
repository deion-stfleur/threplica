#!/usr/bin/env bash
# Bootstrap helpers for a RunPod GPU pod.
# Run inside the pod after SpatialForge + TRELLIS.2 are present.
set -euo pipefail

echo "==> GPU check"
nvidia-smi

WORKSPACE="${WORKSPACE:-/workspace}"
TRELLIS_DIR="${TRELLIS_REPO_PATH:-$WORKSPACE/TRELLIS.2}"
SF_DIR="${SPATIALFORGE_DIR:-$WORKSPACE/spatialforge}"

echo "==> Expect TRELLIS at: $TRELLIS_DIR"
echo "==> Expect SpatialForge at: $SF_DIR"

if [[ ! -d "$TRELLIS_DIR" ]]; then
  echo "TRELLIS.2 not found. Clone it with:"
  echo "  git clone -b main https://github.com/microsoft/TRELLIS.2.git --recursive $TRELLIS_DIR"
  exit 1
fi

if [[ ! -d "$SF_DIR/backend" ]]; then
  echo "SpatialForge backend not found at $SF_DIR/backend"
  echo "Upload or git-clone the project into $SF_DIR"
  exit 1
fi

echo "==> Next steps (manual — official TRELLIS install):"
echo "  cd $TRELLIS_DIR"
echo "  export CUDA_HOME=/usr/local/cuda"
echo "  . ./setup.sh --new-env --basic --flash-attn --nvdiffrast --nvdiffrec --cumesh --o-voxel --flexgemm"
echo "  conda activate trellis2"
echo "  python example.py"
echo
echo "Then configure $SF_DIR/backend/.env with:"
echo "  TRELLIS_MOCK_MODE=false"
echo "  TRELLIS_REPO_PATH=$TRELLIS_DIR"
echo "  PUBLIC_BASE_URL=https://<pod-id>-8000.proxy.runpod.net"
echo
echo "See docs/RUNPOD.md for the full guide."
