#!/bin/bash
set -e

# Create directories if they don't exist
mkdir -p ../src/api/wasm
mkdir -p ../public/wasm

echo "Compiling C++ to WASM..."

# Compile
# -O3: Max optimization
# --bind: Use Embind
# -s MODULARIZE=1: Create a factory function
# -s EXPORT_NAME: Name of the factory function
# -s ENVIRONMENT=web: Target web environment
em++ -O3 SignalLib.cpp wasm_binding.cpp -o ../src/api/wasm/signal_lib.js \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -s EXPORT_NAME="createSignalModule" \
    -s ENVIRONMENT="web" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -std=c++20 \
    --bind

# Move the .wasm file to public folder so it can be served
mv ../src/api/wasm/signal_lib.wasm ../public/wasm/

echo "Compilation complete. Files generated in src/api/wasm/ and public/wasm/"
