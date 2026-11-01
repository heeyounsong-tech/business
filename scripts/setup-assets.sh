#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/wasm public/pose-runtime
cp node_modules/@mediapipe/tasks-vision/wasm/* public/wasm/
# The official npm package is verified by npm's lockfile integrity checks.
# Copy the complete Lite runtime; omit Full/Heavy models that this app does not use.
for asset in pose.js pose_landmark_lite.tflite pose_solution_packed_assets_loader.js pose_solution_packed_assets.data pose_solution_simd_wasm_bin.data pose_solution_simd_wasm_bin.js pose_solution_simd_wasm_bin.wasm pose_solution_wasm_bin.js pose_solution_wasm_bin.wasm pose_web.binarypb; do
  cp "node_modules/@mediapipe/pose/$asset" "public/pose-runtime/$asset"
done
printf 'Official MediaPipe Lite runtime and models installed locally\n'
