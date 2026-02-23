#!/bin/bash
set -e
echo "➡️ Iniciando Instalação do Emscripten..."
if [ ! -d ~/emsdk ]; then
  git clone https://github.com/emscripten-core/emsdk.git ~/emsdk
fi
cd ~/emsdk
./emsdk install latest
./emsdk activate latest

if ! grep -q 'source ~/emsdk/emsdk_env.sh' ~/.bashrc; then
  echo 'source ~/emsdk/emsdk_env.sh' >> ~/.bashrc
fi
source ~/emsdk/emsdk_env.sh

echo "➡️ Instalando Pyodide via NPM..."
cd /home/gui/cristalterminal
npm install pyodide --legacy-peer-deps

echo "➡️ Criando pasta public/wasm..."
mkdir -p /home/gui/cristalterminal/public/wasm

echo "➡️ Compilando C++ quantitativo para WebAssembly (WASM)..."
cd /home/gui/cristalterminal/native/quant
emcc black_scholes.cpp monte_carlo.cpp -O3 \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_bs_call","_bs_put","_bs_delta_call","_bs_delta_put","_bs_gamma","_bs_vega","_bs_theta_call","_bs_theta_put","_bs_vol_implicita","_mc_opcao","_var_historico","_var_montecarlo","_gbm_precos_finais"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","HEAPF64","_malloc","_free"]' \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="CristalQuant" \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s ENVIRONMENT=web \
  -o ../../public/wasm/quant.js

echo "✅ SUCESSO ABSOLUTO! TUDO COMPILADO E INSTALADO!"
