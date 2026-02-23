#!/bin/bash
set -e
source ~/emsdk/emsdk_env.sh
cd /home/gui/cristalterminal/native/quant
echo "Compiling..."
emcc black_scholes.cpp monte_carlo.cpp -O3 \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_bs_call","_bs_put","_bs_delta_call","_bs_delta_put","_bs_gamma","_bs_vega","_bs_theta_call","_bs_theta_put","_bs_vol_implicita","_mc_opcao","_var_historico","_var_montecarlo","_gbm_precos_finais","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","HEAPF64"]' \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="CristalQuant" \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s ENVIRONMENT=web \
  -o ../../public/wasm/quant.js
echo "Done!"
