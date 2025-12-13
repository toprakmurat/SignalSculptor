#!/usr/bin/env bash

set -e

trap "kill 0" SIGINT SIGTERM

echo "🔧 Building C++ server..."
cd cpp_server
cmake --build build
cd ..

echo "🚀 Starting C++ server..."
./cpp_server/build/server &

echo "🚀 Starting Envoy..."
envoy -c envoy.yaml &

echo "🚀 Starting frontend..."
npm run dev &

wait
