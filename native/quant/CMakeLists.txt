cmake_minimum_required(VERSION 3.16)
project(cristal_quant)
set(CMAKE_CXX_STANDARD 17)

# ── Build nativo (para testes/benchmarks) ─────────────────────
add_library(cristal_quant SHARED
    black_scholes.cpp
    monte_carlo.cpp
)
target_compile_options(cristal_quant PRIVATE -O3 -march=native -ffast-math)

# ── Build WebAssembly via Emscripten ──────────────────────────
# Pré-requisito: source /path/to/emsdk/emsdk_env.sh
#
# Usar em vez de cmake:
#   emcc -O3 -s WASM=1 -s EXPORTED_FUNCTIONS='[
#       "_bs_call","_bs_put","_bs_delta_call","_bs_delta_put",
#       "_bs_gamma","_bs_vega","_bs_theta_call","_bs_theta_put",
#       "_bs_vol_implicita",
#       "_mc_opcao","_var_historico","_var_montecarlo","_gbm_precos_finais"
#   ]' -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","HEAPF64","_malloc","_free"]'
#   -s MODULARIZE=1 -s EXPORT_NAME="CristalQuant"
#   -s ALLOW_MEMORY_GROWTH=1
#   -s ENVIRONMENT=web
#   black_scholes.cpp monte_carlo.cpp
#   -o ../../public/wasm/quant.js
#
# Isso gera: public/wasm/quant.js + public/wasm/quant.wasm
